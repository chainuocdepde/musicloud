import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../components';

const SettingsScreen = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { changeLanguage, isEnglish } = useLanguage();
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    Alert.alert('Coming Soon', 'Password change will be available soon');
  };

  const handleAbout = () => {
    Alert.alert(
      'About',
      'Mini SoundCloud\nVersion 1.0.0\n\nA music streaming app built with React Native and Expo.'
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Appearance Section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Appearance
      </Text>
      <Card style={styles.card}>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={24}
              color={theme.colors.text}
            />
            <Text style={[styles.settingText, { color: theme.colors.text }]}>
              Dark Mode
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>
      </Card>

      {/* Language Section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Language
      </Text>
      <Card style={styles.card}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => changeLanguage('en')}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.flagIcon}>🇺🇸</Text>
            <Text style={[styles.settingText, { color: theme.colors.text }]}>
              English
            </Text>
          </View>
          {isEnglish && (
            <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => changeLanguage('vi')}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.flagIcon}>🇻🇳</Text>
            <Text style={[styles.settingText, { color: theme.colors.text }]}>
              Tiếng Việt
            </Text>
          </View>
          {!isEnglish && (
            <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </Card>

      {/* Account Section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Account
      </Text>
      <Card style={styles.card}>
        <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
          <View style={styles.settingLeft}>
            <Ionicons name="person-outline" size={24} color={theme.colors.text} />
            <Text style={[styles.settingText, { color: theme.colors.text }]}>
              Edit Profile
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
          <View style={styles.settingLeft}>
            <Ionicons name="lock-closed-outline" size={24} color={theme.colors.text} />
            <Text style={[styles.settingText, { color: theme.colors.text }]}>
              Change Password
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* About Section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        About
      </Text>
      <Card style={styles.card}>
        <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.text} />
            <Text style={[styles.settingText, { color: theme.colors.text }]}>
              About App
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </Card>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 16,
  },
  flagIcon: {
    fontSize: 28,
    marginRight: 4,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});

export default SettingsScreen;
