import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useTranslation } from 'react-i18next';
import { songsAPI } from '../services/api';
import { SearchBar, SongCard, Loading } from '../components';

const SearchScreen = () => {
  const { theme } = useTheme();
  const { playSong } = usePlayer();
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [allSongs, setAllSongs] = useState([]);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load all songs when component mounts
  useEffect(() => {
    const loadAllSongs = async () => {
      try {
        setLoading(true);
        const response = await songsAPI.getSongs(1000, 0); // Load large number of songs
        if (response.success) {
          setAllSongs(response.songs || []);
        }
      } catch (error) {
        console.error('Error loading songs:', error);
        Alert.alert(t('common.error'), t('errors.networkError'));
      } finally {
        setLoading(false);
      }
    };

    loadAllSongs();
  }, []);

  // Filter songs in real-time as user types (like AdminScreen)
  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = allSongs.filter(song =>
        song.title?.toLowerCase().includes(query.toLowerCase()) ||
        song.artist?.toLowerCase().includes(query.toLowerCase())
      );

      setSuggestions(filtered.slice(0, 5)); // Top 5 for suggestions
      setResults(filtered); // All filtered results
      setShowSuggestions(true);
      setSearched(true);
    } else {
      setSuggestions([]);
      setResults([]);
      setShowSuggestions(false);
      setSearched(false);
    }
  }, [query, allSongs]);

  const handleSearch = () => {
    if (!query.trim()) return;

    // Hide suggestions when user submits search
    setShowSuggestions(false);
    setSearched(true);
  };

  const handleSuggestionPress = (song) => {
    setQuery(song.title);
    setShowSuggestions(false);
    handleSongPress(song);
  };

  const handleQueryChange = (text) => {
    setQuery(text);
    if (text.trim().length === 0) {
      setShowSuggestions(false);
      setSuggestions([]);
      setSearched(false);
      setResults([]);
    }
  };

  const handleSongPress = (song) => {
    playSong(song, results);
  };

  const renderEmpty = () => {
    if (loading) return null;

    if (!searched) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {t('search.placeholder')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {t('search.noResults')}
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
          {t('search.tryDifferent')}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={handleQueryChange}
          onSubmit={handleSearch}
          placeholder={t('search.placeholder')}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            ...theme.shadows.md
          }]}>
            {suggestions.map((song) => (
              <TouchableOpacity
                key={song.song_id}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(song)}
              >
                <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
                <View style={styles.suggestionText}>
                  <Text style={[styles.suggestionTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {song.title}
                  </Text>
                  <Text style={[styles.suggestionArtist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {song.artist}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.song_id}
          renderItem={({ item }) => (
            <SongCard song={item} onPress={() => handleSongPress(item)} />
          )}
          contentContainerStyle={styles.content}
          ListEmptyComponent={renderEmpty}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 300,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionArtist: {
    fontSize: 12,
  },
  content: {
    padding: 16,
    paddingTop: 0,
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

export default SearchScreen;
