import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { songsAPI } from '../services/api';

const PlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  const [sound, setSound] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off', 'one', 'all'
  const [volume, setVolume] = useState(1.0);

  const playbackUpdateInterval = useRef(null);
  const isPlayingRef = useRef(false); // Ref to track play state synchronously
  const lastPlayTime = useRef(0); // Track last play time for debouncing

  // Configure audio mode
  useEffect(() => {
    configureAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (playbackUpdateInterval.current) {
        clearInterval(playbackUpdateInterval.current);
      }
    };
  }, []);

  const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
        interruptionModeIOS: 1, // Do not mix with other audio
        interruptionModeAndroid: 1, // Do not mix with other audio
      });
    } catch (error) {
      console.error('Error configuring audio:', error);
    }
  };

  // Update playback position
  const startPlaybackUpdate = () => {
    if (playbackUpdateInterval.current) {
      clearInterval(playbackUpdateInterval.current);
    }

    playbackUpdateInterval.current = setInterval(async () => {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);

            // Check if song finished
            if (status.didJustFinish) {
              handleSongFinish();
            }
          }
        } catch (error) {
          console.error('Error getting playback status:', error);
        }
      }
    }, 500);
  };

  const stopPlaybackUpdate = () => {
    if (playbackUpdateInterval.current) {
      clearInterval(playbackUpdateInterval.current);
      playbackUpdateInterval.current = null;
    }
  };

  // Play song
  const playSong = async (song, playlistQueue = []) => {
    // CRITICAL: Prevent spam clicking with debounce (500ms)
    const now = Date.now();
    if (now - lastPlayTime.current < 500) {
      Alert.alert('⚠️ Chậm lại!', 'Đừng bấm quá nhanh. Vui lòng đợi bài hát load xong.');
      return;
    }
    lastPlayTime.current = now;

    // CRITICAL: Check if already playing using ref (synchronous check)
    if (isPlayingRef.current) {
      console.log('Already loading/playing a song, blocking...');
      Alert.alert('⏳ Đang phát nhạc', 'Vui lòng đợi bài hát hiện tại load xong.');
      return;
    }

    try {
      // Set ref immediately (synchronous) to block other calls
      isPlayingRef.current = true;
      setIsLoading(true);

      // Validate song and audio URL
      if (!song || !song.audio_url) {
        console.error('Invalid song or missing audio URL:', song);
        Alert.alert('Lỗi', 'Không thể phát bài hát này. File âm thanh bị thiếu.');
        isPlayingRef.current = false;
        setIsLoading(false);
        return;
      }

      // CRITICAL: Unload ALL previous sounds aggressively
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          console.log('Error unloading previous sound:', e);
        }
        stopPlaybackUpdate();
      }

      // Load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audio_url },
        { shouldPlay: true, volume },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setCurrentSong(song);
      setIsPlaying(true);
      setPosition(0);

      // Set queue if provided
      if (playlistQueue.length > 0) {
        setQueue(playlistQueue);
        const index = playlistQueue.findIndex((s) => s.song_id === song.song_id);
        setCurrentIndex(index >= 0 ? index : 0);
      } else {
        setQueue([song]);
        setCurrentIndex(0);
      }

      startPlaybackUpdate();

      // Record play on backend
      try {
        await songsAPI.playSong(song.song_id);
      } catch (error) {
        console.error('Error recording play:', error);
      }
    } catch (error) {
      console.error('Error playing song:', error);
      Alert.alert('Lỗi', 'Không thể phát bài hát. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      // Keep ref locked for a bit longer to prevent rapid clicks
      setTimeout(() => {
        isPlayingRef.current = false;
      }, 500);
    }
  };

  // Pause/Resume
  const togglePlayPause = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
          stopPlaybackUpdate();
        } else {
          await sound.playAsync();
          setIsPlaying(true);
          startPlaybackUpdate();
        }
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  // Stop
  const stop = async () => {
    if (!sound) return;

    try {
      await sound.stopAsync();
      setIsPlaying(false);
      setPosition(0);
      stopPlaybackUpdate();
    } catch (error) {
      console.error('Error stopping:', error);
    }
  };

  // Next song
  const playNext = async () => {
    if (queue.length === 0) return;

    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          return;
        }
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      await playSong(nextSong, queue);
      setCurrentIndex(nextIndex);
    }
  };

  // Previous song
  const playPrevious = async () => {
    if (queue.length === 0) return;

    // If more than 3 seconds played, restart current song
    if (position > 3000) {
      await seekTo(0);
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (repeat === 'all') {
        prevIndex = queue.length - 1;
      } else {
        return;
      }
    }

    const prevSong = queue[prevIndex];
    if (prevSong) {
      await playSong(prevSong, queue);
      setCurrentIndex(prevIndex);
    }
  };

  // Seek to position
  const seekTo = async (positionMs) => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(positionMs);
      setPosition(positionMs);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  // Set volume
  const changeVolume = async (newVolume) => {
    if (!sound) return;

    try {
      await sound.setVolumeAsync(newVolume);
      setVolume(newVolume);
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };

  // Toggle shuffle
  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  // Toggle repeat
  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeat);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeat(nextMode);
  };

  // Handle song finish
  const handleSongFinish = async () => {
    if (repeat === 'one') {
      await seekTo(0);
      await sound?.playAsync();
    } else {
      await playNext();
    }
  };

  // Playback status update callback
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  };

  const value = {
    currentSong,
    isPlaying,
    isLoading,
    position,
    duration,
    queue,
    currentIndex,
    shuffle,
    repeat,
    volume,
    playSong,
    togglePlayPause,
    stop,
    playNext,
    playPrevious,
    seekTo,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};
