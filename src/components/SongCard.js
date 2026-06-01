import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';

export const SongCard = ({ song, onPress }) => {
  const { theme } = useTheme();
  const { currentSong, isPlaying } = usePlayer();

  const isCurrentSong = currentSong?.song_id === song.song_id;

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isCurrentSong ? theme.colors.surface : theme.colors.card,
          ...theme.shadows.sm,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: song.cover_url || 'https://via.placeholder.com/60' }}
        style={styles.cover}
      />
      <View style={styles.info}>
        <Text
          style={[
            styles.title,
            { color: isCurrentSong ? theme.colors.primary : theme.colors.text },
          ]}
          numberOfLines={1}
        >
          {song.title}
        </Text>
        <Text style={[styles.artist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {song.artist}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="play" size={12} color={theme.colors.textSecondary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
            {song.play_count || 0}
          </Text>
          {song.duration_ms > 0 && (
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
              • {formatDuration(song.duration_ms)}
            </Text>
          )}
        </View>
      </View>
      {isCurrentSong && isPlaying && (
        <View style={styles.playingIndicator}>
          <Ionicons name="volume-high" size={20} color={theme.colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cover: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  playingIndicator: {
    marginLeft: 8,
  },
});
