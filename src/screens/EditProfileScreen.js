import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { usersAPI } from '../services/api';
import { Button, Input } from '../components';

const EditProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const updateData = {
        username,
        email,
        bio,
      };

      // If avatar changed, upload it
      if (avatarUri !== user?.avatar_url) {
        // TODO: Implement avatar upload
        // For now, just include the URI
        updateData.avatar_url = avatarUri;
      }

      const response = await usersAPI.updateProfile(user.user_id, updateData);

      if (response.success) {
        updateUser(response.user);
        Alert.alert(t('common.success'), 'Profile updated successfully');
        navigation.goBack();
      } else {
        Alert.alert(t('common.error'), response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.error'), error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Image
            source={{ uri: avatarUri || 'https://via.placeholder.com/120' }}
            style={styles.avatar}
          />
          <TouchableOpacity
            style={[styles.changeAvatarButton, { backgroundColor: theme.colors.primary }]}
            onPress={pickImage}
          >
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.changeAvatarText, { color: theme.colors.primary }]}>
          Tap to change avatar
        </Text>

        {/* Form Section */}
        <View style={styles.form}>
          <Input
            label="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setErrors({ ...errors, username: null });
            }}
            placeholder="Enter username"
            error={errors.username}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors({ ...errors, email: null });
            }}
            placeholder="Enter email"
            keyboardType="email-address"
            error={errors.email}
          />

          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
            style={styles.bioInput}
          />

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />

          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  changeAvatarText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    marginTop: 8,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 12,
  },
});

export default EditProfileScreen;
