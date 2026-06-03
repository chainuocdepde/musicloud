import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { useTheme } from '../contexts/ThemeContext';

export const RoomCard = ({
  room,
  onPress,
  onJoin,
  showJoinButton = false,
}) => {
  const { theme } = useTheme();
  const memberCount = room.members?.length || 0;
  const maxMembers = room.max_members || 10;

  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text
            style={[styles.roomName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {room.room_name}
          </Text>
          <Text style={[styles.memberCount, { color: theme.colors.textSecondary }]}>
            {memberCount}/{maxMembers} members
          </Text>
        </View>
        {room.invite_code && (
          <Text style={[styles.inviteCode, { color: theme.colors.primary }]}>
            #{room.invite_code}
          </Text>
        )}
      </View>

      {showJoinButton && (
        <Button
          title="Join Room"
          onPress={onJoin}
          variant="primary"
          size="small"
          style={styles.joinButton}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '400',
  },
  inviteCode: {
    fontSize: 14,
    fontWeight: '600',
  },
  joinButton: {
    marginTop: 12,
  },
});
