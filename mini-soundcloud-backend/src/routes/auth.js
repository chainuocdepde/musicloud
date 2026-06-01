const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/authenticate');
const { generateResetToken, generateOTP, sendPasswordResetEmail, sendOTPEmail } = require('../config/email');

const router = express.Router();

const generateToken = (user) => {
    return jwt.sign(
        {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Username phải từ 3-50 ký tự'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password phải có ít nhất 8 ký tự'
            });
        }

        const { data: existingUsers, error: checkError } = await supabase
            .from('users')
            .select('user_id')
            .or(`email.eq.${email},username.eq.${username}`);

        if (checkError) {
            throw checkError;
        }

        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc username đã tồn tại'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    email,
                    password_hash: passwordHash,
                    auth_method: 'password',
                    role: 'user',
                    preferences: {}
                }
            ])
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        const token = generateToken(newUser);
        const refreshToken = generateRefreshToken(newUser);

        const userResponse = {
            user_id: newUser.user_id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            avatar_url: newUser.avatar_url,
            created_at: newUser.created_at
        };

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            user: userResponse,
            token,
            refresh_token: refreshToken
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng ký',
            error: error.message
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email_or_username, password } = req.body;

        if (!email_or_username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        const { data: users, error: findError } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${email_or_username},username.eq.${email_or_username}`)
            .limit(1);

        if (findError) {
            throw findError;
        }

        if (!users || users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email/username hoặc password không đúng'
            });
        }

        const user = users[0];

        if (user.auth_method !== 'password') {
            return res.status(400).json({
                success: false,
                message: `Tài khoản này đăng nhập bằng ${user.auth_method}`
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email/username hoặc password không đúng'
            });
        }

        // Check if user is active
        if (user.is_active === false) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ admin.'
            });
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        const userResponse = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
            created_at: user.created_at
        };

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            user: userResponse,
            token,
            refresh_token: refreshToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng nhập',
            error: error.message
        });
    }
});

router.post('/google', async (req, res) => {
    try {
        const { access_token } = req.body;

        if (!access_token) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu access_token'
            });
        }

        const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const googleUser = googleResponse.data;

        const { data: existingUsers, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', googleUser.email)
            .limit(1);

        if (findError) {
            throw findError;
        }

        let user;
        let isNewUser = false;

        if (existingUsers && existingUsers.length > 0) {
            user = existingUsers[0];

            // Check if existing user is active
            if (user.is_active === false) {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ admin.'
                });
            }
        } else {
            const username = googleUser.email.split('@')[0] + '_' + Date.now();

            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        username,
                        email: googleUser.email,
                        avatar_url: googleUser.picture,
                        auth_method: 'google',
                        role: 'user',
                        preferences: {}
                    }
                ])
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            user = newUser;
            isNewUser = true;
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        const userResponse = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
            created_at: user.created_at
        };

        res.json({
            success: true,
            user: userResponse,
            token,
            refresh_token: refreshToken,
            is_new_user: isNewUser
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng nhập với Google',
            error: error.message
        });
    }
});

router.post('/discord', async (req, res) => {
    try {
        const { access_token } = req.body;

        if (!access_token) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu access_token'
            });
        }

        const discordResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const discordUser = discordResponse.data;
        const email = discordUser.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Không lấy được email từ Discord'
            });
        }

        const { data: existingUsers, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (findError) {
            throw findError;
        }

        let user;
        let isNewUser = false;

        if (existingUsers && existingUsers.length > 0) {
            user = existingUsers[0];

            // Check if existing user is active
            if (user.is_active === false) {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ admin.'
                });
            }
        } else {
            const username = discordUser.username + '_' + Date.now();
            const avatarUrl = discordUser.avatar
                ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                : null;

            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        username,
                        email,
                        avatar_url: avatarUrl,
                        auth_method: 'discord',
                        role: 'user',
                        preferences: {}
                    }
                ])
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            user = newUser;
            isNewUser = true;
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        const userResponse = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
            created_at: user.created_at
        };

        res.json({
            success: true,
            user: userResponse,
            token,
            refresh_token: refreshToken,
            is_new_user: isNewUser
        });
    } catch (error) {
        console.error('Discord auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng nhập với Discord',
            error: error.message
        });
    }
});

router.post('/facebook', async (req, res) => {
    try {
        const { access_token } = req.body;

        if (!access_token) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu access_token'
            });
        }

        const facebookResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                fields: 'id,name,email,picture',
                access_token: access_token
            }
        });

        const facebookUser = facebookResponse.data;
        const email = facebookUser.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Không lấy được email từ Facebook. Vui lòng cấp quyền email.'
            });
        }

        const { data: existingUsers, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (findError) {
            throw findError;
        }

        let user;
        let isNewUser = false;

        if (existingUsers && existingUsers.length > 0) {
            user = existingUsers[0];

            // Check if existing user is active
            if (user.is_active === false) {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ admin.'
                });
            }
        } else {
            const username = (facebookUser.name || facebookUser.id).replace(/\s+/g, '_') + '_' + Date.now();
            const avatarUrl = facebookUser.picture?.data?.url || null;

            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        username,
                        email,
                        avatar_url: avatarUrl,
                        auth_method: 'facebook',
                        role: 'user',
                        preferences: {}
                    }
                ])
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            user = newUser;
            isNewUser = true;
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        const userResponse = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
            created_at: user.created_at
        };

        res.json({
            success: true,
            user: userResponse,
            token,
            refresh_token: refreshToken,
            is_new_user: isNewUser
        });
    } catch (error) {
        console.error('Facebook auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng nhập với Facebook',
            error: error.message
        });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        const { data: users, error: findError } = await supabase
            .from('users')
            .select('user_id, email, auth_method')
            .eq('email', email)
            .limit(1);

        if (findError) {
            throw findError;
        }

        if (!users || users.length === 0) {
            return res.json({
                success: true,
                message: 'Nếu email tồn tại, bạn sẽ nhận được mã OTP'
            });
        }

        const user = users[0];

        if (user.auth_method !== 'password') {
            return res.status(400).json({
                success: false,
                message: `Tài khoản này đăng nhập bằng ${user.auth_method}. Không thể đặt lại mật khẩu.`
            });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 600000); // 10 minutes

        const { error: updateError } = await supabase
            .from('users')
            .update({
                reset_token: otp,
                reset_token_expiry: otpExpiry.toISOString()
            })
            .eq('user_id', user.user_id);

        if (updateError) {
            throw updateError;
        }

        const emailResult = await sendOTPEmail(email, otp);

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Không thể gửi email. Vui lòng thử lại sau.'
            });
        }

        res.json({
            success: true,
            message: 'Mã OTP đã được gửi đến email của bạn'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xử lý yêu cầu',
            error: error.message
        });
    }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu email hoặc mã OTP'
            });
        }

        const { data: users, error: findError } = await supabase
            .from('users')
            .select('user_id, reset_token, reset_token_expiry')
            .eq('email', email)
            .limit(1);

        if (findError) {
            throw findError;
        }

        if (!users || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Email không tồn tại'
            });
        }

        const user = users[0];

        if (!user.reset_token || user.reset_token !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không đúng'
            });
        }

        if (!user.reset_token_expiry || new Date(user.reset_token_expiry) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP đã hết hạn'
            });
        }

        res.json({
            success: true,
            message: 'Mã OTP hợp lệ'
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xác thực OTP',
            error: error.message
        });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu email, OTP hoặc mật khẩu mới'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 8 ký tự'
            });
        }

        const { data: users, error: findError } = await supabase
            .from('users')
            .select('user_id, reset_token, reset_token_expiry')
            .eq('email', email)
            .limit(1);

        if (findError) {
            throw findError;
        }

        if (!users || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Email không tồn tại'
            });
        }

        const user = users[0];

        if (!user.reset_token || user.reset_token !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không đúng'
            });
        }

        if (!user.reset_token_expiry || new Date(user.reset_token_expiry) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP đã hết hạn'
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        const { error: updateError } = await supabase
            .from('users')
            .update({
                password_hash: passwordHash,
                reset_token: null,
                reset_token_expiry: null
            })
            .eq('user_id', user.user_id);

        if (updateError) {
            throw updateError;
        }

        res.json({
            success: true,
            message: 'Mật khẩu đã được đặt lại thành công'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đặt lại mật khẩu',
            error: error.message
        });
    }
});

router.post('/logout', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng xuất',
            error: error.message
        });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu refresh_token'
            });
        }

        const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);

        const newToken = jwt.sign(
            {
                user_id: decoded.user_id,
                username: decoded.username,
                role: decoded.role,
                email: decoded.email
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        res.json({
            success: true,
            token: newToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Refresh token không hợp lệ hoặc đã hết hạn'
        });
    }
});

module.exports = router;