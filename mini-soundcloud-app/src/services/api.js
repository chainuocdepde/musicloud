import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { storage } from '../utils/storage';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`,
            { refresh_token: refreshToken }
          );

          const { token } = response.data;
          await storage.saveToken(token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        await storage.clearAll();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH METHODS
// ============================================

export const authAPI = {
  // Register new user
  async register(username, email, password) {
    try {
      const response = await api.post(API_ENDPOINTS.REGISTER, {
        username,
        email,
        password,
      });

      if (response.data.success) {
        const { token, refresh_token, user } = response.data;
        await storage.saveToken(token);
        await storage.saveRefreshToken(refresh_token);
        await storage.saveUser(user);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login with email/username and password
  async login(emailOrUsername, password) {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, {
        email_or_username: emailOrUsername,
        password,
      });

      if (response.data.success) {
        const { token, refresh_token, user } = response.data;
        await storage.saveToken(token);
        await storage.saveRefreshToken(refresh_token);
        await storage.saveUser(user);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login with Google
  async loginWithGoogle(accessToken) {
    try {
      const response = await api.post(API_ENDPOINTS.GOOGLE_AUTH, {
        access_token: accessToken,
      });

      if (response.data.success) {
        const { token, refresh_token, user } = response.data;
        await storage.saveToken(token);
        await storage.saveRefreshToken(refresh_token);
        await storage.saveUser(user);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login with Discord
  async loginWithDiscord(accessToken) {
    try {
      const response = await api.post(API_ENDPOINTS.DISCORD_AUTH, {
        access_token: accessToken,
      });

      if (response.data.success) {
        const { token, refresh_token, user } = response.data;
        await storage.saveToken(token);
        await storage.saveRefreshToken(refresh_token);
        await storage.saveUser(user);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login with Facebook
  async loginWithFacebook(accessToken) {
    try {
      const response = await api.post(API_ENDPOINTS.FACEBOOK_AUTH, {
        access_token: accessToken,
      });

      if (response.data.success) {
        const { token, refresh_token, user } = response.data;
        await storage.saveToken(token);
        await storage.saveRefreshToken(refresh_token);
        await storage.saveUser(user);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout
  async logout() {
    try {
      await api.post(API_ENDPOINTS.LOGOUT);
      await storage.clearAll();
      return { success: true };
    } catch (error) {
      // Clear storage even if API call fails
      await storage.clearAll();
      throw error.response?.data || error;
    }
  },

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post(API_ENDPOINTS.REFRESH_TOKEN, {
        refresh_token: refreshToken,
      });

      if (response.data.success) {
        const { token } = response.data;
        await storage.saveToken(token);
      }

      return response.data;
    } catch (error) {
      await storage.clearAll();
      throw error.response?.data || error;
    }
  },

  // Get current user from storage
  async getCurrentUser() {
    return await storage.getUser();
  },
};

// ============================================
// SONGS METHODS
// ============================================

export const songsAPI = {
  // Get all songs with pagination
  async getSongs(limit = 50, offset = 0) {
    try {
      const response = await api.get(API_ENDPOINTS.SONGS, {
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get trending songs
  async getTrending(limit = 10) {
    try {
      const response = await api.get(API_ENDPOINTS.TRENDING, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search songs
  async searchSongs(query) {
    try {
      const response = await api.get(API_ENDPOINTS.SEARCH, {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get song detail
  async getSongDetail(songId) {
    try {
      const response = await api.get(API_ENDPOINTS.SONG_DETAIL(songId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete song
  async deleteSong(songId) {
    try {
      const response = await api.delete(API_ENDPOINTS.DELETE_SONG(songId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Record play
  async playSong(songId, durationListenedMs = 0, completed = false) {
    try {
      const response = await api.post(API_ENDPOINTS.PLAY_SONG(songId), {
        duration_listened_ms: durationListenedMs,
        completed,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ============================================
// USERS METHODS
// ============================================

export const usersAPI = {
  // Get user profile
  async getUserProfile(userId) {
    try {
      const response = await api.get(API_ENDPOINTS.USER_PROFILE(userId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user profile
  async updateProfile(userId, data) {
    try {
      const response = await api.put(API_ENDPOINTS.UPDATE_PROFILE(userId), data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user uploads
  async getUserUploads(userId, limit = 50, offset = 0) {
    try {
      const response = await api.get(API_ENDPOINTS.USER_UPLOADS(userId), {
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user history
  async getUserHistory(userId, limit = 50) {
    try {
      const response = await api.get(API_ENDPOINTS.USER_HISTORY(userId), {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ============================================
// UPLOAD METHODS
// ============================================

export const uploadAPI = {
  // Upload song with audio and optional cover
  async uploadSong(formData) {
    try {
      const response = await api.post(API_ENDPOINTS.UPLOAD_SONG, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for upload
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ============================================
// PLAYBACK METHODS
// ============================================

export const playbackAPI = {
  // Record play history
  async recordHistory(songId, durationListenedMs = 0, completed = false) {
    try {
      const response = await api.post(API_ENDPOINTS.RECORD_HISTORY, {
        song_id: songId,
        duration_listened_ms: durationListenedMs,
        completed,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default api;
