const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const songsRoutes = require('./routes/songs');
const uploadRoutes = require('./routes/upload');
const usersRoutes = require('./routes/users');
const playbackRoutes = require('./routes/playback');
const adminRoutes = require('./routes/admin');
const downloadsRoutes = require('./routes/downloads');
const recommendationsRoutes = require('./routes/recommendations');
const statsRoutes = require('./routes/stats');

// SỬA CHỖ NÀY: Bóc tách lấy riêng thuộc tính router từ Object được export ra
const { router: roomsRoutes } = require('./routes/rooms');

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút'
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n➡️  [${timestamp}] ${req.method} ${req.path}`);
    if (Object.keys(req.body).length > 0) {
        console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
    if (Object.keys(req.query).length > 0) {
        console.log('🔍 Query:', JSON.stringify(req.query, null, 2));
    }

    const oldJson = res.json.bind(res);
    res.json = (data) => {
        const responseTime = new Date().toISOString();
        console.log(`⬅️  [${responseTime}] ${res.statusCode} ${req.method} ${req.path}`);
        console.log('📤 Response:', JSON.stringify(data, null, 2));
        return oldJson(data);
    };

    next();
});

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Mini SoundCloud API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            songs: '/api/songs',
            upload: '/api/upload',
            users: '/api/users',
            playback: '/api/playback',
            admin: '/api/admin'
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/playback', playbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/downloads', downloadsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/stats', statsRoutes);

// SỬA CHỖ NÀY: Lúc này roomsRoutes đã là hàm router chuẩn, Express sẽ nhận diện được luôn
app.use('/api/rooms', roomsRoutes);

app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`\n💥 [${timestamp}] LỖI TOÀN CỤC:`);
    console.error('📍 Message:', err.message);
    console.error('📂 Stack:', err.stack);
    console.error('🔗 Request:', `${req.method} ${req.path}`);
    if (Object.keys(req.body).length > 0) {
        console.error('📦 Body:', JSON.stringify(req.body, null, 2));
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint không tồn tại'
    });
});

module.exports = app;