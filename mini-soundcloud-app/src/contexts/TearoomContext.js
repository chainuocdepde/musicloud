import React, { createContext, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { storage } from '../utils/storage';

export const TearoomContext = createContext();

export const TearoomProvider = ({ children }) => {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // States
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [queue, setQueue] = useState([]);
  const [roomPlaybackState, setRoomPlaybackState] = useState({
    current_song_id: null,
    is_playing: false,
    current_time_ms: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.50:3000/api';
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://192.168.1.50:3000';

  // Helper: Connect WebSocket
  const connectWebSocket = useCallback((roomId, token) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${WS_URL}/ws/rooms/${roomId}?token=${token}`;
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected to room:', roomId);
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Connection error');
      };

      wsRef.current.onclose = () => {
        console.log('⛔ WebSocket closed');
        wsRef.current = null;
      };
    } catch (err) {
      console.error('❌ WebSocket connection failed:', err);
      setError(err.message);
    }
  }, [WS_URL]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((event) => {
    const { type, data } = event;

    switch (type) {
      case 'CONNECTED':
        console.log('✅ Connected to room');
        break;

      case 'NEW_MESSAGE':
        setChatMessages(prev => [...prev, {
          id: data.id,
          user: data.user,
          content: data.content,
          sent_at: data.sent_at
        }]);
        break;

      case 'MEMBER_JOINED':
        setMembers(prev => [...prev, {
          user_id: data.user_id,
          username: data.username,
          avatar: data.avatar
        }]);
        break;

      case 'MEMBER_LEFT':
        setMembers(prev => prev.filter(m => m.user_id !== data.user_id));
        break;

      case 'QUEUE_UPDATED':
        setQueue(prev => [...prev, data.queue_item]);
        break;

      case 'QUEUE_REORDERED':
        setQueue(data.queue);
        break;

      case 'SYNC_TIME':
        setRoomPlaybackState({
          current_song_id: data.current_song_id,
          is_playing: data.is_playing,
          current_time_ms: data.current_time_ms
        });
        break;

      case 'ERROR':
        setError(data.message);
        break;

      default:
        console.warn('Unknown event type:', type);
    }
  }, []);

  // Send WebSocket message
  const sendWSMessage = useCallback((event) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }, []);

  // Create Room
  const createRoom = useCallback(async (name, maxMembers = 10) => {
    try {
      setLoading(true);
      setError(null);

      // Validate room name
      if (!name || !name.trim()) {
        console.warn('⚠️ No room name provided');
        setError('Room name is required');
        setLoading(false);
        return;
      }

      // Get token from storage helper
      const token = await storage.getToken();

      console.log('🔑 Token for createRoom:', token ? `${token.substring(0, 20)}...` : 'NULL');

      // If no token, redirect to login
      if (!token) {
        console.error('❌ No token found - redirecting to login');
        setError('Session expired. Please login again.');
        // Navigation would go here - for now just throw error
        throw new Error('No authentication token');
      }

      console.log('📤 Sending POST /api/rooms with Authorization header');
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, maxMembers })
      });

      console.log('📥 Response status:', response.status);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create room');
      }

      setCurrentRoom(result.data);
      setIsHost(true);
      connectWebSocket(result.data.room_id, token);

      console.log('✅ Room created successfully:', result.data.room_id);
      return result.data;
    } catch (err) {
      console.error('❌ Error creating room:', err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, connectWebSocket, API_URL]);

  // Fetch All Rooms
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await storage.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_URL}/rooms`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch rooms');
      }

      return result.data;
    } catch (err) {
      console.error('❌ Error fetching rooms:', err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Join Room
  const joinRoom = useCallback(async (inviteCode) => {
    try {
      setLoading(true);
      setError(null);

      // Get token from storage helper
      const token = await storage.getToken();

      console.log('🔑 Token for joinRoom:', token ? `${token.substring(0, 20)}...` : 'NULL');

      if (!token) {
        console.error('❌ No token found - redirecting to login');
        setError('Session expired. Please login again.');
        throw new Error('No authentication token');
      }

      console.log('📤 Sending POST /api/rooms/join with Authorization header');
      const response = await fetch(`${API_URL}/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode })
      });

      console.log('📥 Response status:', response.status);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to join room');
      }

      setCurrentRoom(result.data);
      setIsHost(result.data.host_user_id === user?.id);
      connectWebSocket(result.data.room_id, token);

      console.log('✅ Room joined successfully:', result.data.room_id);
      return result.data;
    } catch (err) {
      console.error('❌ Error joining room:', err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, connectWebSocket, API_URL]);

  // Leave Room
  const leaveRoom = useCallback(async () => {
    try {
      if (!currentRoom) return;

      const token = user?.session?.access_token;
      await fetch(`${API_URL}/rooms/${currentRoom.room_id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }

      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      setCurrentRoom(null);
      setIsHost(false);
      setMembers([]);
      setChatMessages([]);
      setQueue([]);
    } catch (err) {
      console.error('❌ Error leaving room:', err);
      setError(err.message);
    }
  }, [currentRoom, user, API_URL]);

  // Send Message
  const sendMessage = useCallback(async (content) => {
    try {
      if (!currentRoom || !content.trim()) {
        console.warn('⚠️ No room or empty content');
        return;
      }

      console.log('📤 Sending message via WebSocket first...');

      // Try WebSocket first
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendWSMessage({
          type: 'SEND_MESSAGE',
          data: { content }
        });
        console.log('✅ Message sent via WebSocket');
        return;
      }

      // Fallback: Use REST API if WebSocket not available
      console.log('⚠️ WebSocket not ready - using REST API fallback');
      const token = await storage.getToken();

      if (!token) {
        throw new Error('No authentication token');
      }

      console.log('📤 Sending message via REST API to /api/rooms/:roomId/messages');
      const response = await fetch(`${API_URL}/rooms/${currentRoom.room_id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      console.log('📥 REST API response status:', response.status);
      if (!response.ok) {
        throw new Error(`REST API error: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to send message');
      }

      console.log('✅ Message sent via REST API');

      // Update local chat messages
      if (result.data) {
        setChatMessages(prev => [...prev, {
          id: result.data.id,
          user: result.data.user,
          content: result.data.content,
          sent_at: result.data.sent_at
        }]);
      }
    } catch (err) {
      console.error('❌ Error sending message:', err.message);
      setError(err.message);
    }
  }, [currentRoom, sendWSMessage, API_URL]);

  // Add To Queue
  const addToQueue = useCallback(async (songId) => {
    try {
      if (!currentRoom || !wsRef.current) return;
      sendWSMessage({
        type: 'ADD_TO_QUEUE',
        data: { song_id: songId }
      });
    } catch (err) {
      console.error('❌ Error adding to queue:', err);
      setError(err.message);
    }
  }, [currentRoom, sendWSMessage]);

  // Reorder Queue (Host only)
  const reorderQueue = useCallback(async (newQueueList) => {
    try {
      if (!isHost || !wsRef.current) return;
      sendWSMessage({
        type: 'REORDER_QUEUE',
        data: { newOrder: newQueueList }
      });
    } catch (err) {
      console.error('❌ Error reordering queue:', err);
      setError(err.message);
    }
  }, [isHost, sendWSMessage]);

  // Sync Playback (Host only, emit every 2 seconds)
  const syncPlaybackHost = useCallback(async (songId, timeMs, isPlaying) => {
    try {
      if (!isHost || !wsRef.current) return;
      sendWSMessage({
        type: 'SYNC_PLAYBACK',
        data: {
          current_song_id: songId,
          current_time_ms: timeMs,
          is_playing: isPlaying
        }
      });
    } catch (err) {
      console.error('❌ Error syncing playback:', err);
      setError(err.message);
    }
  }, [isHost, sendWSMessage]);

  const value = {
    currentRoom,
    isHost,
    members,
    chatMessages,
    queue,
    roomPlaybackState,
    loading,
    error,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    addToQueue,
    reorderQueue,
    syncPlaybackHost,
  };

  return (
    <TearoomContext.Provider value={value}>
      {children}
    </TearoomContext.Provider>
  );
};
