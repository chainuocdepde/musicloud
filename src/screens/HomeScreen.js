import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useTranslation } from 'react-i18next';
import { songsAPI } from '../services/api';
import { SongCard, Loading } from '../components';

const HomeScreen = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { changeLanguage, isEnglish } = useLanguage();
  const { playSong } = usePlayer();
  const { t } = useTranslation();

  const [trending, setTrending] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trendingRes, songsRes] = await Promise.all([
        songsAPI.getTrending(10),
        songsAPI.getSongs(20, 0),
      ]);

      if (trendingRes.success) {
        setTrending(trendingRes.songs);
      }

      if (songsRes.success) {
        setRecentSongs(songsRes.songs);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(t('common.error'), t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSongPress = (song) => {
    playSong(song, recentSongs);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            {t('home.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Discover new music
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => changeLanguage(isEnglish ? 'vi' : 'en')}
          >
            <Text style={styles.flagIcon}>{isEnglish ? '🇺🇸' : '🇻🇳'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Upload')}
          >
            <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {trending.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🔥 {t('home.trending')}
            </Text>
          </View>
          <FlatList
            horizontal
            data={trending.slice(0, 5)}
            keyExtractor={(item) => item.song_id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.trendingCard}
                onPress={() => handleSongPress(item)}
              >
                <View
                  style={[
                    styles.trendingCardInner,
                    { backgroundColor: theme.colors.card, ...theme.shadows.lg },
                  ]}
                >
                  {item.cover_url ? (
                    <Image
                      source={{ uri: item.cover_url }}
                      style={styles.trendingCover}
                    />
                  ) : (
                    <View style={[styles.trendingCoverPlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Ionicons name="musical-notes" size={40} color={theme.colors.primary} />
                    </View>
                  )}
                  <View style={styles.trendingBadge}>
                    <Text style={styles.trendingBadgeText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.trendingInfo}>
                    <Text
                      style={[styles.trendingTitle, { color: theme.colors.text }]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.trendingArtist, { color: theme.colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.artist}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingList}
          />
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          ✨ {t('home.newReleases')}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={recentSongs}
        keyExtractor={(item) => item.song_id}
        renderItem={({ item }) => (
          <SongCard song={item} onPress={() => handleSongPress(item)} />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
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
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
  },
  flagIcon: {
    fontSize: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  trendingList: {
    paddingRight: 16,
  },
  trendingCard: {
    marginRight: 12,
  },
  trendingCardInner: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingCover: {
    width: 160,
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  trendingCoverPlaceholder: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trendingInfo: {
    padding: 12,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingArtist: {
    fontSize: 12,
  },
});

export default HomeScreen;
