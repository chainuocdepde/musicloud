import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { uploadAPI } from '../services/api';
import { Button, Input } from '../components';

const UploadScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setAudioFile(result.assets[0]);
        setErrors({ ...errors, audioFile: null });
      }
    } catch (error) {
      console.error('Error picking audio:', error);
      Alert.alert(t('common.error'), 'Failed to pick audio file');
    }
  };

  const pickCover = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library permission');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCoverImage(result.assets[0]);
        setErrors({ ...errors, coverImage: null });
      }
    } catch (error) {
      console.error('Error picking cover:', error);
      Alert.alert(t('common.error'), 'Failed to pick cover image');
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = t('upload.titleRequired');
    }

    if (!artist.trim()) {
      newErrors.artist = t('upload.artistRequired');
    }

    if (!audioFile) {
      newErrors.audioFile = t('upload.audioRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validate()) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('artist', artist.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      formData.append('audio_file', {
        uri: audioFile.uri,
        type: audioFile.mimeType || 'audio/mpeg',
        name: audioFile.name || 'audio.mp3',
      });

      if (coverImage) {
        formData.append('cover_image', {
          uri: coverImage.uri,
          type: coverImage.mimeType || 'image/jpeg',
          name: coverImage.fileName || 'cover.jpg',
        });
      }

      const response = await uploadAPI.uploadSong(formData);

      if (response.success) {
        Alert.alert(t('common.success'), t('upload.uploadSuccess'), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(t('common.error'), response.message || t('upload.uploadError'));
      }
    } catch (error) {
      console.error('Error uploading:', error);
      Alert.alert(t('common.error'), error.message || t('upload.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Input
        label={t('upload.songTitle')}
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          setErrors({ ...errors, title: null });
        }}
        placeholder="Enter song title"
        error={errors.title}
      />

      <Input
        label={t('upload.artist')}
        value={artist}
        onChangeText={(text) => {
          setArtist(text);
          setErrors({ ...errors, artist: null });
        }}
        placeholder="Enter artist name"
        error={errors.artist}
      />

      <Input
        label={t('upload.description')}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter description (optional)"
      />

      <View style={styles.fileSection}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('upload.selectAudio')} *
        </Text>
        <TouchableOpacity
          style={[
            styles.filePicker,
            {
              backgroundColor: theme.colors.surface,
              borderColor: errors.audioFile ? theme.colors.error : theme.colors.border,
            },
          ]}
          onPress={pickAudio}
        >
          <Ionicons name="musical-notes" size={24} color={theme.colors.textSecondary} />
          <Text style={[styles.fileText, { color: theme.colors.text }]}>
            {audioFile ? audioFile.name : 'Choose audio file'}
          </Text>
        </TouchableOpacity>
        {errors.audioFile && (
          <Text style={[styles.error, { color: theme.colors.error }]}>{errors.audioFile}</Text>
        )}
      </View>

      <View style={styles.fileSection}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('upload.selectCover')}
        </Text>
        <TouchableOpacity
          style={[
            styles.filePicker,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={pickCover}
        >
          {coverImage ? (
            <Image source={{ uri: coverImage.uri }} style={styles.coverPreview} />
          ) : (
            <>
              <Ionicons name="image" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.fileText, { color: theme.colors.text }]}>
                Choose cover image
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Button
        title={t('upload.title')}
        onPress={handleUpload}
        loading={uploading}
        style={styles.uploadButton}
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
  fileSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  fileText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  coverPreview: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  uploadButton: {
    marginTop: 8,
  },
});

export default UploadScreen;
