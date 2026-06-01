import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useNavigation } from '@react-navigation/native';

export const MiniPlayer = () => {
  const { theme } = useTheme();
  const { currentSong, isPlaying, togglePlayPause } = usePlayer();
  const navigation = useNavigation();

  if (!currentSong) return null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.playerBackground,
          borderTopColor: theme.colors.border,
          ...theme.shadows.lg,
        },
      ]}
      onPress={() => navigation.navigate('Player')}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: currentSong.cover_url || 'https://via.placeholder.com/50' }}
        style={styles.cover}
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {currentSong.title}
        </Text>
        <Text style={[styles.artist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {currentSong.artist}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.playButton}
        onPress={(e) => {
          e.stopPropagation();
          togglePlayPause();
        }}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={28}
          color={theme.colors.primary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cover: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
  },
  playButton: {
    padding: 8,
  },
});
