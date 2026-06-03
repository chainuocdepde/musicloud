import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const QueueItem = ({
  item,
  index,
  isCurrentSong = false,
  isHost = false,
  onDragStart,
  onRemove,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isCurrentSong
            ? theme.colors.primary + '20'
            : 'transparent',
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      {/* Drag Handle (Host only) */}
      {isHost && (
        <TouchableOpacity
          style={styles.dragHandle}
          onLongPress={onDragStart}
        >
          <Text style={{ color: theme.colors.textSecondary }}>⋮⋮</Text>
        </TouchableOpacity>
      )}

      {/* Index */}
      <Text
        style={[
          styles.index,
          {
            color: isCurrentSong
              ? theme.colors.primary
              : theme.colors.textSecondary,
            fontWeight: isCurrentSong ? '700' : '500',
          },
        ]}
      >
        {index + 1}
      </Text>

      {/* Song Info */}
      <View style={styles.infoContainer}>
        <Text
          numberOfLines={1}
          style={[
            styles.songTitle,
            {
              color: theme.colors.text,
              fontWeight: isCurrentSong ? '600' : '500',
            },
          ]}
        >
          {item.title || 'Unknown Track'}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.artist, { color: theme.colors.textSecondary }]}
        >
          {item.artist || 'Unknown Artist'}
        </Text>
      </View>

      {/* Current Playing Indicator */}
      {isCurrentSong && (
        <Text style={styles.playingIndicator}>♫</Text>
      )}

      {/* Remove Button (Host only) */}
      {isHost && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
        >
          <Text style={{ color: theme.colors.error }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dragHandle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  index: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  infoContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  songTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  artist: {
    fontSize: 11,
    fontWeight: '400',
  },
  playingIndicator: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
