import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, Loading } from '../components';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/api';

const AdminScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isEnglish } = useLanguage();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'songs'
  const [users, setUsers] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const t = {
    adminPanel: isEnglish ? 'Admin Panel' : 'Quản Trị',
    manageUsers: isEnglish ? 'Manage users and content' : 'Quản lý người dùng và nội dung',
    users: isEnglish ? 'Users' : 'Người dùng',
    songs: isEnglish ? 'Songs' : 'Bài hát',
    search: isEnglish ? 'Search' : 'Tìm kiếm',
    noUsersFound: isEnglish ? 'No users found' : 'Không tìm thấy người dùng',
    noSongsFound: isEnglish ? 'No songs found' : 'Không tìm thấy bài hát',
    deleteUser: isEnglish ? 'Delete User' : 'Xóa Người Dùng',
    deleteUserConfirm: isEnglish ? 'Are you sure you want to delete this user?' : 'Bạn có chắc muốn xóa người dùng này?',
    deleteSong: isEnglish ? 'Delete Song' : 'Xóa Bài Hát',
    deleteSongConfirm: isEnglish ? 'Are you sure you want to delete this song?' : 'Bạn có chắc muốn xóa bài hát này?',
    cancel: isEnglish ? 'Cancel' : 'Hủy',
    delete: isEnglish ? 'Delete' : 'Xóa',
    success: isEnglish ? 'Success' : 'Thành công',
    userDeleted: isEnglish ? 'User deleted successfully' : 'Đã xóa người dùng',
    songDeleted: isEnglish ? 'Song deleted successfully' : 'Đã xóa bài hát',
    error: isEnglish ? 'Error' : 'Lỗi',
    failedToDelete: isEnglish ? 'Failed to delete' : 'Xóa thất bại',
    role: isEnglish ? 'Role' : 'Vai trò',
    uploads: isEnglish ? 'Uploads' : 'Đã tải lên',
    plays: isEnglish ? 'Plays' : 'Lượt nghe',
    by: isEnglish ? 'By' : 'Bởi',
    userEnabled: isEnglish ? 'User enabled successfully' : 'Đã kích hoạt người dùng',
    userDisabled: isEnglish ? 'User disabled successfully' : 'Đã vô hiệu hóa người dùng',
    failedToToggle: isEnglish ? 'Failed to toggle user status' : 'Không thể thay đổi trạng thái',
    active: isEnglish ? 'Active' : 'Hoạt động',
    disabled: isEnglish ? 'Disabled' : 'Vô hiệu hóa',
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else {
      loadSongs();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.ADMIN_USERS);
      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const loadSongs = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.SONGS, {
        params: { limit: 100 }
      });
      if (response.data.success) {
        setSongs(response.data.songs || []);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
      Alert.alert('Error', 'Failed to load songs');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.DELETE_USER(userId));
              Alert.alert('Success', 'User deleted successfully');
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.patch(API_ENDPOINTS.TOGGLE_USER_STATUS(userId), {
        is_active: newStatus
      });

      // Update local state
      setUsers(users.map(u =>
        u.user_id === userId ? { ...u, is_active: newStatus } : u
      ));

      Alert.alert(
        t.success,
        newStatus ? t.userEnabled : t.userDisabled
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert(t.error, t.failedToToggle);
    }
  };

  const deleteSong = async (songId) => {
    Alert.alert(
      'Delete Song',
      'Are you sure you want to delete this song?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.DELETE_SONG(songId));
              Alert.alert('Success', 'Song deleted successfully');
              loadSongs();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete song');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSongs = songs.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }) => {
    const isActive = item.is_active !== false; // Default to true if not set

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <View style={styles.itemTitleRow}>
              <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                {item.username}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isActive ? '#34C759' : '#8E8E93' }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {isActive ? t.active : t.disabled}
                </Text>
              </View>
            </View>
            <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]}>
              {item.email}
            </Text>
            <View style={styles.itemMeta}>
              <Text style={[styles.itemMetaText, { color: theme.colors.textSecondary }]}>
                Role: {item.role || 'user'}
              </Text>
              <Text style={[styles.itemMetaText, { color: theme.colors.textSecondary }]}>
                • Uploads: {item.uploads_count || 0}
              </Text>
            </View>
          </View>
          <View style={styles.itemActions}>
            <Switch
              value={isActive}
              onValueChange={() => toggleUserStatus(item.user_id, isActive)}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D1D6"
            />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteUser(item.user_id)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  const renderSongItem = ({ item }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]}>
            {item.artist}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={[styles.itemMetaText, { color: theme.colors.textSecondary }]}>
              Plays: {item.play_count || 0}
            </Text>
            {(item.uploader_username || item.uploaded_by_name) && (
              <Text style={[styles.itemMetaText, { color: theme.colors.textSecondary }]}>
                • By: {item.uploader_username || item.uploaded_by_name}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteSong(item.song_id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t.adminPanel}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {t.manageUsers}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'users' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'users' ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'users' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            {t.users} ({users.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'songs' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('songs')}
        >
          <Ionicons
            name="musical-notes"
            size={20}
            color={activeTab === 'songs' ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'songs' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            {t.songs} ({songs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder={`${t.search} ${activeTab}...`}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={activeTab === 'users' ? filteredUsers : filteredSongs}
          keyExtractor={(item) => activeTab === 'users' ? item.user_id : item.song_id}
          renderItem={activeTab === 'users' ? renderUserItem : renderSongItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'users' ? 'people-outline' : 'musical-notes-outline'}
                size={64}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {activeTab === 'users' ? t.noUsersFound : t.noSongsFound}
              </Text>
            </View>
          }
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
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
  header: {
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  itemMetaText: {
    fontSize: 12,
  },
  itemActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default AdminScreen;
