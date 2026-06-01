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

const HistoryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const { t } = useTranslation();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUserHistory(user.user_id, 50);

      if (response.success) {
        setHistory(response.history || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      Alert.alert(t('common.error'), t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleSongPress = (historyItem) => {
    // Extract the actual song object from history item
    const song = historyItem.songs || historyItem;
    playSong(song, history.map(h => h.songs || h));
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        {t('history.empty')}
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
        {t('history.emptySubtext')}
      </Text>
    </View>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={history}
        keyExtractor={(item, index) => `${item.song_id || item.history_id}-${index}`}
        renderItem={({ item }) => {
          const song = item.songs || item;
          return <SongCard song={song} onPress={() => handleSongPress(item)} />;
        }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HistoryScreen;
