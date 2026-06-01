import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const PlayerScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    queue,
    currentIndex,
    shuffle,
    repeat,
    volume,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();
  const { t } = useTranslation();

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = () => {
    if (repeat === 'one') return 'repeat-outline';
    if (repeat === 'all') return 'repeat';
    return 'repeat-outline';
  };

  if (!currentSong) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-down" size={32} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No song playing
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={32} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('player.nowPlaying')}
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.artworkContainer}>
          <Image
            source={{ uri: currentSong.cover_url || 'https://via.placeholder.com/300' }}
            style={[styles.artwork, theme.shadows.lg]}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {currentSong.title}
          </Text>
          <Text style={[styles.artist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={position}
            onSlidingComplete={seekTo}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.timeContainer}>
            <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
              {formatTime(position)}
            </Text>
            <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleShuffle}
          >
            <Ionicons
              name={shuffle ? 'shuffle' : 'shuffle-outline'}
              size={24}
              color={shuffle ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={playPrevious}
          >
            <Ionicons name="play-skip-back" size={32} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: theme.colors.primary, ...theme.shadows.lg },
            ]}
            onPress={togglePlayPause}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={40}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={playNext}
          >
            <Ionicons name="play-skip-forward" size={32} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleRepeat}
          >
            <Ionicons
              name={getRepeatIcon()}
              size={24}
              color={repeat !== 'off' ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.volumeContainer}>
          <Ionicons name="volume-low" size={20} color={theme.colors.textSecondary} />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={changeVolume}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <Ionicons name="volume-high" size={20} color={theme.colors.textSecondary} />
        </View>

        {queue.length > 1 && (
          <View style={styles.queueContainer}>
            <Text style={[styles.queueTitle, { color: theme.colors.text }]}>
              Up Next ({queue.length - currentIndex - 1})
            </Text>
            {queue.slice(currentIndex + 1, currentIndex + 4).map((song, index) => (
              <View
                key={song.song_id}
                style={[
                  styles.queueItem,
                  { borderBottomColor: theme.colors.border },
                ]}
              >
                <Image
                  source={{ uri: song.cover_url || 'https://via.placeholder.com/40' }}
                  style={styles.queueCover}
                />
                <View style={styles.queueInfo}>
                  <Text
                    style={[styles.queueTitle, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {song.title}
                  </Text>
                  <Text
                    style={[styles.queueArtist, { color: theme.colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {song.artist}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  artwork: {
    width: width - 80,
    height: width - 80,
    borderRadius: 12,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 32,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 12,
  },
  queueContainer: {
    marginTop: 16,
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  queueCover: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  queueInfo: {
    flex: 1,
  },
  queueArtist: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default PlayerScreen;
