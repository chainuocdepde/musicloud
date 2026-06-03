import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { TearoomContext } from '../contexts/TearoomContext';
import { Button } from '../components/Button';

export const TearoomDetailScreen = ({ route, navigation }) => {
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
    addToQueue,
    sendMessage,
    reorderQueue,
    syncPlaybackHost,
    leaveRoom,
  } = useContext(TearoomContext);

  const [chatInput, setChatInput] = useState('');
  const [expandedQueue, setExpandedQueue] = useState(false);

  // Handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    try {
      await sendMessage(chatInput);
      setChatInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const handlePlayPause = async () => {
    if (isHost && roomPlaybackState.current_song_id) {
      await syncPlaybackHost(
        roomPlaybackState.current_song_id,
        roomPlaybackState.current_time_ms,
        !roomPlaybackState.is_playing
      );
    }
  };

  const handleSkip = async () => {
    if (isHost && queue.length > 1) {
      // Skip logic - would need backend implementation
      await syncPlaybackHost(
        queue[1]?.id,
        0,
        true
      );
    }
  };

  // Header Section
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
      <View style={styles.headerTop}>
        <View style={styles.headerInfo}>
          <Text style={[styles.roomName, { color: theme.colors.text }]}>
            {currentRoom?.room_name || 'Room'}
          </Text>
          <Text style={[styles.memberCount, { color: theme.colors.textSecondary }]}>
            {members?.length || 0} members
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.inviteButton}>
            <Text style={[styles.inviteCode, { color: theme.colors.primary }]}>
              #{currentRoom?.invite_code || 'N/A'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLeaveRoom}
            style={styles.leaveButton}
          >
            <Text style={{ color: theme.colors.error }}>{t('tearoom.leave')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Members List (Horizontal) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.membersList}
      >
        {members?.map((member) => (
          <View key={member.id} style={styles.memberItem}>
            {member.avatar ? (
              <Image
                source={{ uri: member.avatar }}
                style={styles.memberAvatar}
              />
            ) : (
              <View style={[styles.memberAvatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>
                  {member.username?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text
              numberOfLines={1}
              style={[styles.memberName, { color: theme.colors.text }]}
            >
              {member.username}
            </Text>
            {isHost && member.id === currentRoom?.host_user_id && (
              <Text style={styles.hostBadge}>Host</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Player Section
  const renderPlayer = () => (
    <View style={[styles.playerSection, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.albumArt}>
        {roomPlaybackState?.current_song_id ? (
          <View style={styles.playingIndicator}>
            <Text style={styles.playingText}>♫</Text>
          </View>
        ) : (
          <View style={styles.noSongIndicator}>
            <Text style={[styles.noSongText, { color: theme.colors.textSecondary }]}>
              {t('tearoom.noSongPlaying')}
            </Text>
          </View>
        )}
      </View>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text
          numberOfLines={2}
          style={[styles.songTitle, { color: theme.colors.text }]}
        >
          {roomPlaybackState?.current_song_id ? 'Current Song' : 'Queue is empty'}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.artistName, { color: theme.colors.textSecondary }]}
        >
          {isHost ? t('tearoom.youreHosting') : t('tearoom.listening')}
        </Text>
      </View>

      {/* Playback Controls (Host Only) */}
      {isHost && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, { borderColor: theme.colors.primary }]}
            onPress={handlePlayPause}
            disabled={!roomPlaybackState?.current_song_id}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 18 }}>
              {roomPlaybackState?.is_playing ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, { borderColor: theme.colors.primary }]}
            onPress={handleSkip}
            disabled={queue?.length <= 1}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 18 }}>⏭</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Queue Section (PENDING: reorderQueue backend implementation)
  const renderQueueSection = () => (
    <View style={[styles.queueSection, { backgroundColor: theme.colors.card }]}>
      <TouchableOpacity
        onPress={() => setExpandedQueue(!expandedQueue)}
        style={styles.queueHeader}
      >
        <Text style={[styles.queueTitle, { color: theme.colors.text }]}>
          {t('tearoom.queue')} ({queue?.length || 0})
        </Text>
        <Text style={{ color: theme.colors.primary }}>
          {expandedQueue ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {expandedQueue && (
        <FlatList
          data={queue}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.queueItem,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.queueIndex, { color: theme.colors.textSecondary }]}>
                {index + 1}
              </Text>
              <Text
                numberOfLines={2}
                style={[styles.queueSongTitle, { color: theme.colors.text }]}
              >
                {item.title || 'Unknown Track'}
              </Text>
              {isHost && (
                <Text style={{ color: theme.colors.primary }}>≡</Text>
              )}
            </View>
          )}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />
      )}

      <Button
        title={t('tearoom.addToQueue')}
        onPress={() => {
          // TODO: Navigate to song selection
          addToQueue('song_id_placeholder');
        }}
        variant="secondary"
        size="small"
        style={styles.addQueueButton}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.scrollView}>
        {renderHeader()}
        {renderPlayer()}
        {renderQueueSection()}
      </ScrollView>

      {/* Chat Box */}
      <View style={[styles.chatBox, { backgroundColor: theme.colors.card }]}>
        {/* Messages List */}
        <FlatList
          data={chatMessages}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.user?.user_id === user?.id
                  ? styles.messageRight
                  : styles.messageLeft,
              ]}
            >
              {item.user?.user_id !== user?.id && (
                <Text
                  style={[
                    styles.messageUsername,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.user?.username}
                </Text>
              )}
              <View
                style={[
                  styles.messageContent,
                  {
                    backgroundColor:
                      item.user?.id === user?.id
                        ? theme.colors.primary
                        : theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    {
                      color:
                        item.user?.id === user?.id
                          ? '#FFFFFF'
                          : theme.colors.text,
                    },
                  ]}
                >
                  {item.content}
                </Text>
              </View>
              <Text
                style={[
                  styles.messageTime,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {item.sent_at ? new Date(item.sent_at).toLocaleTimeString() : ''}
              </Text>
            </View>
          )}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          inverted
          scrollEnabled={true}
          style={styles.messagesList}
        />

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            { borderTopColor: theme.colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.chatInput,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder={t('tearoom.typeAMessage')}
            placeholderTextColor={theme.colors.textSecondary}
            value={chatInput}
            onChangeText={setChatInput}
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!chatInput.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor: chatInput.trim()
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
              },
            ]}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  inviteCode: {
    fontSize: 12,
    fontWeight: '600',
  },
  leaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  membersList: {
    marginTop: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  memberItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 10,
    fontWeight: '500',
    maxWidth: 50,
    textAlign: 'center',
  },
  hostBadge: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFA500',
    marginTop: 2,
  },
  playerSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  playingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingText: {
    fontSize: 60,
    opacity: 0.6,
  },
  noSongIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSongText: {
    fontSize: 14,
    fontWeight: '500',
  },
  songInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  artistName: {
    fontSize: 12,
    fontWeight: '400',
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueSection: {
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  queueIndex: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
    width: 20,
  },
  queueSongTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  addQueueButton: {
    marginHorizontal: 12,
    marginVertical: 12,
  },
  chatBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageBubble: {
    marginVertical: 4,
  },
  messageLeft: {
    alignItems: 'flex-start',
  },
  messageRight: {
    alignItems: 'flex-end',
  },
  messageUsername: {
    fontSize: 10,
    marginBottom: 2,
    marginHorizontal: 8,
  },
  messageContent: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '400',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 2,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
