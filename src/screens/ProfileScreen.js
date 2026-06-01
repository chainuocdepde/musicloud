import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { usersAPI } from '../services/api';
import { Button, Card, Loading } from '../components';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUserProfile(user.user_id);

      if (response.success) {
        setProfile(response.user);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert(t('common.error'), t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('auth.logout'),
      'Are you sure you want to logout?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              Alert.alert(t('common.success'), t('auth.logoutSuccess'));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Image
          source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/120' }}
          style={styles.avatar}
        />
        <Text style={[styles.username, { color: theme.colors.text }]}>
          {profile?.username}
        </Text>
        <Text style={[styles.email, { color: theme.colors.textSecondary }]}>
          {profile?.email}
        </Text>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {profile?.stats?.uploads_count || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t('profile.uploads')}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {profile?.stats?.total_plays || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t('profile.plays')}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.menuCard}>
        {/* Admin Panel - Only show for admin users */}
        {user?.role === 'admin' && (
          <>
            <TouchableOpacity
              style={[styles.menuItem, styles.adminMenuItem]}
              onPress={() => navigation.navigate('Admin')}
            >
              <Ionicons name="shield-checkmark" size={24} color="#FF6B35" />
              <Text style={[styles.menuText, { color: '#FF6B35', fontWeight: '600' }]}>
                Admin Panel
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: theme.colors.border }]} />
          </>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Upload')}
        >
          <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.text} />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>
            {t('upload.title')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.colors.border }]} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('History')}
        >
          <Ionicons name="time-outline" size={24} color={theme.colors.text} />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>
            {t('profile.history')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.colors.border }]} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>
            {t('settings.title')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      <Button
        title={t('auth.logout')}
        onPress={handleLogout}
        variant="secondary"
        style={styles.logoutButton}
      />
    </ScrollView>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  menuCard: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  adminMenuItem: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
  logoutButton: {
    marginTop: 8,
  },
});

export default ProfileScreen;
