import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useTranslation } from 'react-i18next';
import { usersAPI } from '../services/api';
import { SongCard, Loading } from '../components';

const LibraryScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const { t } = useTranslation();

  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadUploads();
    }
  }, [user]);

  const loadUploads = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUserUploads(user.user_id);

      if (response.success) {
        setUploads(response.songs);
      }
    } catch (error) {
      console.error('Error loading uploads:', error);
      Alert.alert(t('common.error'), t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUploads();
    setRefreshing(false);
  };

  const handleSongPress = (song) => {
    playSong(song, uploads);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        {t('library.empty')}
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
        {t('library.addSongs')}
      </Text>
    </View>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={uploads}
        keyExtractor={(item) => item.song_id}
        renderItem={({ item }) => (
          <SongCard song={item} onPress={() => handleSongPress(item)} />
        )}
        contentContainerStyle={styles.content}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default LibraryScreen;
