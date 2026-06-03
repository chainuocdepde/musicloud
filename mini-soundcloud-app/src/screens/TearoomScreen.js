import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { TearoomContext } from '../contexts/TearoomContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { RoomCard } from '../components/RoomCard';
import { Loading } from '../components/Loading';

export const TearoomScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    currentRoom,
    isHost,
    members,
    chatMessages,
    queue,
    roomPlaybackState,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    error,
  } = useContext(TearoomContext);

  // Mock rooms list - replace with real data from context/API
  const [rooms, setRooms] = useState([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [createFormData, setCreateFormData] = useState({
    roomName: '',
    maxMembers: '8',
  });

  const [joinFormData, setJoinFormData] = useState({
    inviteCode: '',
  });

  const [errors, setErrors] = useState({});

  // Fetch rooms on mount
  React.useEffect(() => {
    const loadRooms = async () => {
      try {
        const roomsList = await fetchRooms();
        setRooms(roomsList || []);
      } catch (err) {
        console.error('Failed to load rooms:', err);
      }
    };

    loadRooms();
  }, [fetchRooms]);

  // Create Room Handler
  const handleCreateRoom = async () => {
    // Validation
    const newErrors = {};
    if (!createFormData.roomName.trim()) {
      newErrors.roomName = t('tearoom.roomNameRequired');
    }
    if (!createFormData.maxMembers || parseInt(createFormData.maxMembers) < 2) {
      newErrors.maxMembers = t('tearoom.minMembers');
    }
    if (parseInt(createFormData.maxMembers) > 50) {
      newErrors.maxMembers = t('tearoom.maxMembers');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const newRoom = await createRoom(createFormData.roomName, parseInt(createFormData.maxMembers));
      // Refresh rooms list
      const roomsList = await fetchRooms();
      setRooms(roomsList || []);
      // Reset form and close modal on success
      setCreateFormData({ roomName: '', maxMembers: '8' });
      setShowCreateModal(false);
      setErrors({});
      // Navigate to room detail
      if (newRoom) {
        navigation.navigate('TearoomDetail', { roomId: newRoom.room_id });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create room' });
    } finally {
      setLoading(false);
    }
  };

  // Join Room Handler
  const handleJoinRoom = async () => {
    // Validation
    const newErrors = {};
    if (!joinFormData.inviteCode.trim()) {
      newErrors.inviteCode = t('tearoom.codeRequired');
    }
    if (joinFormData.inviteCode.length !== 6) {
      newErrors.inviteCode = t('tearoom.codeFormat');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await joinRoom(joinFormData.inviteCode);
      setJoinFormData({ inviteCode: '' });
      setShowJoinModal(false);
      setErrors({});
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to join room' });
    } finally {
      setLoading(false);
    }
  };

  // Render room item
  const renderRoomItem = ({ item }) => (
    <RoomCard
      room={item}
      onPress={() => {
        navigation.navigate('TearoomDetail', { roomId: item.room_id });
      }}
      onJoin={() => handleJoinRoom()}
    />
  );

  // Empty state
  if (rooms.length === 0 && !currentRoom) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {t('tearoom.noActiveRooms')}
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}
          >
            {t('tearoom.joinFriendsAndListen')}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Button
            title={t('tearoom.createRoom')}
            onPress={() => setShowCreateModal(true)}
            variant="primary"
            size="large"
            style={{ marginBottom: 12 }}
          />
          <Button
            title={t('tearoom.joinRoom')}
            onPress={() => setShowJoinModal(true)}
            variant="secondary"
            size="large"
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('tearoom.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {t('tearoom.joinFriendsAndListen')}
        </Text>
      </View>

      {/* Rooms List */}
      <FlatList
        data={rooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.room_id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <Button
          title={t('tearoom.createNewRoom')}
          onPress={() => setShowCreateModal(true)}
          variant="primary"
          size="medium"
          style={{ marginBottom: 12 }}
        />
        <Button
          title={t('tearoom.joinWithCode')}
          onPress={() => setShowJoinModal(true)}
          variant="secondary"
          size="medium"
        />
      </View>

      {/* CREATE ROOM MODAL */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('tearoom.createRoom')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
              >
                <Text style={{ color: theme.colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Input
                label={t('tearoom.roomName')}
                value={createFormData.roomName}
                onChangeText={(text) =>
                  setCreateFormData({ ...createFormData, roomName: text })
                }
                placeholder="e.g., Chill Vibes"
                error={errors.roomName}
              />

              <Input
                label={t('tearoom.maxMembers')}
                value={createFormData.maxMembers}
                onChangeText={(text) =>
                  setCreateFormData({ ...createFormData, maxMembers: text })
                }
                placeholder="2-50"
                keyboardType="numeric"
                error={errors.maxMembers}
              />

              {errors.submit && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.submit}
                </Text>
              )}

              <Button
                title={t('tearoom.createRoom')}
                onPress={handleCreateRoom}
                loading={loading}
                disabled={loading}
                variant="primary"
                size="large"
                style={{ marginTop: 24 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* JOIN ROOM MODAL */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('tearoom.joinRoom')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowJoinModal(false)}
                style={styles.closeButton}
              >
                <Text style={{ color: theme.colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Input
                label={t('tearoom.inviteCode')}
                value={joinFormData.inviteCode}
                onChangeText={(text) =>
                  setJoinFormData({ inviteCode: text.toUpperCase().slice(0, 6) })
                }
                placeholder="ABC123"
                autoCapitalize="characters"
                error={errors.inviteCode}
              />

              {errors.submit && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.submit}
                </Text>
              )}

              <Button
                title={t('tearoom.joinRoom')}
                onPress={handleJoinRoom}
                loading={loading}
                disabled={loading}
                variant="primary"
                size="large"
                style={{ marginTop: 24 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 32,
  },
  actionButtons: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  modalForm: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '500',
  },
});
