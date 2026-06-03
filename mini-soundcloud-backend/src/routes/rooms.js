const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Store active rooms and their WebSocket connections
const activeRooms = new Map();
const userSockets = new Map(); // Map userId -> Set of WebSocket connections

// Helper: Generate 6-character invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Helper: Get current user from JWT token
const getCurrentUser = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;

  try {
    // Set auth token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log('❌ Token validation failed:', error?.message);
      return null;
    }
    return user;
  } catch (err) {
    console.log('❌ getCurrentUser error:', err.message);
    return null;
  }
};

// ============= REST APIs =============

// POST /api/rooms - Create new room
router.post('/', authenticate, async (req, res) => {
  try {
    const user = req.user;  // Lấy user từ middleware authenticate
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, maxMembers = 10 } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Room name is required' });

    const roomId = uuidv4();
    const inviteCode = generateInviteCode();

    const { data, error } = await supabase
      .from('rooms')
      .insert([
        {
          room_id: roomId,
          room_name: name,
          host_user_id: user.user_id,
          invite_code: inviteCode,
          max_members: maxMembers,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Add host as member
    await supabase.from('room_members').insert([
      {
        room_id: roomId,
        user_id: user.user_id,
        joined_at: new Date().toISOString()
      }
    ]);

    return res.json({
      success: true,
      data: {
        room_id: data.room_id,
        room_name: data.room_name,
        invite_code: data.invite_code,
        host_user_id: data.host_user_id,
        max_members: data.max_members
      }
    });
  } catch (error) {
    console.error('❌ Error creating room:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/rooms - List all active rooms
router.get('/', authenticate, async (req, res) => {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select(`
        room_id,
        room_name,
        invite_code,
        host_user_id,
        max_members,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // For each room, get member count
    const roomsWithMembers = await Promise.all(
      rooms.map(async (room) => {
        const { count } = await supabase
          .from('room_members')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.room_id);

        return {
          ...room,
          member_count: count || 0
        };
      })
    );

    return res.json({
      success: true,
      data: roomsWithMembers
    });
  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/rooms/:code - Get room info by invite code
router.get('/:code', authenticate, async (req, res) => {
  try {
    const { code } = req.params;

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('invite_code', code)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.json({
      success: true,
      data: {
        room_id: data.room_id,
        room_name: data.room_name,
        invite_code: data.invite_code,
        host_user_id: data.host_user_id,
        max_members: data.max_members
      }
    });
  } catch (error) {
    console.error('❌ Error fetching room:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/rooms/join - Join room by invite code
router.post('/join', authenticate, async (req, res) => {
  try {
    const user = req.user;  // Lấy user từ middleware authenticate
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ success: false, message: 'Invite code is required' });

    // Get room by invite code
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if already member
    const { data: existingMember } = await supabase
      .from('room_members')
      .select('*')
      .eq('room_id', room.room_id)
      .eq('user_id', user.user_id)
      .single();

    if (existingMember) {
      return res.json({
        success: true,
        data: {
          room_id: room.room_id,
          room_name: room.room_name,
          invite_code: room.invite_code,
          host_user_id: room.host_user_id,
          max_members: room.max_members
        }
      });
    }

    // Add user as member
    const { error: insertError } = await supabase.from('room_members').insert([
      {
        room_id: room.room_id,
        user_id: user.user_id,
        joined_at: new Date().toISOString()
      }
    ]);

    if (insertError) throw insertError;

    return res.json({
      success: true,
      data: {
        room_id: room.room_id,
        room_name: room.room_name,
        invite_code: room.invite_code,
        host_user_id: room.host_user_id,
        max_members: room.max_members
      }
    });
  } catch (error) {
    console.error('❌ Error joining room:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/rooms/:roomId/leave - Leave room
router.post('/:roomId/leave', authenticate, async (req, res) => {
  try {
    const user = req.user;  // Lấy user từ middleware authenticate
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { roomId } = req.params;

    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', currentRoom.room_id)
      .eq('user_id', user.user_id);

    if (error) throw error;

    // Broadcast leave event to room
    const roomConnections = activeRooms.get(currentRoom.room_id);
    if (roomConnections) {
      const leaveEvent = {
        type: 'MEMBER_LEFT',
        data: { user_id: user.user_id }
      };
      roomConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(leaveEvent));
        }
      });
    }

    return res.json({ success: true, message: 'Left room' });
  } catch (error) {
    console.error('❌ Error leaving room:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============= WEBSOCKET SETUP =============

// Function to setup WebSocket for a room
const setupRoomWebSocket = (ws, roomId, userId, server) => {
  if (!activeRooms.has(roomId)) {
    activeRooms.set(roomId, new Set());
  }
  activeRooms.get(roomId).add(ws);

  // Track user sockets
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(ws);

  ws.roomId = roomId;
  ws.userId = userId;

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const event = JSON.parse(message);
      await handleWebSocketEvent(event, ws, roomId, userId);
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    const roomConns = activeRooms.get(roomId);
    if (roomConns) roomConns.delete(ws);

    const userConns = userSockets.get(userId);
    if (userConns) userConns.delete(ws);

    // Broadcast member left
    const leaveEvent = {
      type: 'MEMBER_LEFT',
      data: { user_id: userId }
    };
    broadcastToRoom(roomId, leaveEvent, ws);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    data: { user_id: userId, room_id: roomId }
  }));
};

// Broadcast message to all clients in room (except sender if skipSender=true)
const broadcastToRoom = (roomId, event, skipSender = null) => {
  const connections = activeRooms.get(roomId);
  if (!connections) return;

  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN && ws !== skipSender) {
      ws.send(JSON.stringify(event));
    }
  });
};

// Handle WebSocket events
const handleWebSocketEvent = async (event, ws, roomId, userId) => {
  const { type, data } = event;

  switch (type) {
    case 'SEND_MESSAGE': {
      const { content } = data;

      const { data: message, error } = await supabase
        .from('room_messages')
        .insert([
          {
            room_id: roomId,
            user_id: userId,
            content,
            sent_at: new Date().toISOString()
          }
        ])
        .select('*, user:profiles(username, avatar_url)')
        .single();

      if (!error && message) {
        broadcastToRoom(roomId, {
          type: 'NEW_MESSAGE',
          data: {
            id: message.id,
            user: { username: message.user?.username, avatar: message.user?.avatar_url },
            content: message.content,
            sent_at: message.sent_at
          }
        });
      }
      break;
    }

    case 'ADD_TO_QUEUE': {
      const { song_id } = data;
      const { data: queueItem, error } = await supabase
        .from('room_queue')
        .insert([
          {
            room_id: roomId,
            song_id,
            added_by: userId,
            added_at: new Date().toISOString()
          }
        ])
        .select('*, song:songs(*)')
        .single();

      if (!error && queueItem) {
        broadcastToRoom(roomId, {
          type: 'QUEUE_UPDATED',
          data: { queue_item: queueItem }
        });
      }
      break;
    }

    case 'REORDER_QUEUE': {
      const { newOrder } = data;
      // newOrder is array of { queue_id, position }
      for (const item of newOrder) {
        await supabase
          .from('room_queue')
          .update({ position: item.position })
          .eq('id', item.queue_id);
      }

      const { data: updatedQueue } = await supabase
        .from('room_queue')
        .select('*, song:songs(*)')
        .eq('room_id', roomId)
        .order('position', { ascending: true });

      broadcastToRoom(roomId, {
        type: 'QUEUE_REORDERED',
        data: { queue: updatedQueue || [] }
      });
      break;
    }

    case 'SYNC_PLAYBACK': {
      const { current_song_id, current_time_ms, is_playing } = data;

      // Only host can sync playback
      const { data: room } = await supabase
        .from('rooms')
        .select('host_user_id')
        .eq('room_id', roomId)
        .single();

      if (room?.host_user_id !== userId) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          data: { message: 'Only host can sync playback' }
        }));
        break;
      }

      const syncEvent = {
        type: 'SYNC_TIME',
        data: {
          current_song_id,
          current_time_ms,
          is_playing,
          timestamp: Date.now()
        }
      };

      broadcastToRoom(roomId, syncEvent, ws);
      break;
    }

    case 'MEMBER_JOINED': {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar')
        .eq('id', userId)
        .single();

      broadcastToRoom(roomId, {
        type: 'MEMBER_JOINED',
        data: {
          user_id: userId,
          username: profile?.username,
          avatar: profile?.avatar
        }
      }, ws);
      break;
    }

    default:
      console.warn('Unknown WebSocket event type:', type);
  }
};

// Export for server integration
module.exports = { router, setupRoomWebSocket, activeRooms, broadcastToRoom };
