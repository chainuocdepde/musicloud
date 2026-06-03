import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const ChatMessage = ({
  message,
  isOwnMessage = false,
}) => {
  const { theme } = useTheme();
  const timestamp = message.sent_at
    ? new Date(message.sent_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.containerRight : styles.containerLeft,
      ]}
    >
      {!isOwnMessage && (
        <Text
          style={[
            styles.username,
            { color: theme.colors.textSecondary },
          ]}
        >
          {message.user?.username || 'Anonymous'}
        </Text>
      )}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isOwnMessage
              ? theme.colors.primary
              : theme.colors.surface,
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            {
              color: isOwnMessage ? '#FFFFFF' : theme.colors.text,
            },
          ]}
        >
          {message.content}
        </Text>
      </View>
      <Text
        style={[
          styles.timestamp,
          { color: theme.colors.textSecondary },
        ]}
      >
        {timestamp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  containerLeft: {
    alignItems: 'flex-start',
  },
  containerRight: {
    alignItems: 'flex-end',
  },
  username: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
    marginHorizontal: 8,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 2,
    marginHorizontal: 8,
  },
});
