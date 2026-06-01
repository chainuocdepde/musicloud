// Backend API Configuration
// NOTE: Dùng IP local network (192.168.x.x) cho điện thoại thật
// Dùng localhost cho emulator
export const API_BASE_URL = 'http://192.168.1.28:3000/api';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  GOOGLE_AUTH: '/auth/google',
  FACEBOOK_AUTH: '/auth/facebook',
  DISCORD_AUTH: '/auth/discord',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',

  // Songs
  SONGS: '/songs',
  TRENDING: '/songs/trending',
  SEARCH: '/songs/search',
  SONG_DETAIL: (id) => `/songs/${id}`,
  DELETE_SONG: (id) => `/songs/${id}`,
  PLAY_SONG: (id) => `/songs/${id}/play`,

  // Users
  USER_PROFILE: (id) => `/users/${id}`,
  UPDATE_PROFILE: (id) => `/users/${id}`,
  USER_UPLOADS: (id) => `/users/${id}/uploads`,
  USER_HISTORY: (id) => `/users/${id}/history`,

  // Upload
  UPLOAD_SONG: '/upload/song',

  // Playback
  RECORD_HISTORY: '/playback/history',

  // Admin
  ADMIN_USERS: '/admin/users',
  DELETE_USER: (id) => `/admin/users/${id}`,
};
