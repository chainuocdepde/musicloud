const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Đặt lại mật khẩu - Mini SoundCloud',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Đặt lại mật khẩu</h2>
                <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Mini SoundCloud của mình.</p>
                <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
                <a href="${resetUrl}"
                   style="display: inline-block; padding: 12px 24px; background-color: #FF5500;
                          color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Đặt lại mật khẩu
                </a>
                <p>Hoặc sao chép link sau vào trình duyệt:</p>
                <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    Link này sẽ hết hạn sau 1 giờ.<br>
                    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Mã OTP đặt lại mật khẩu - Mini SoundCloud',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Mã OTP đặt lại mật khẩu</h2>
                <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Mini SoundCloud của mình.</p>
                <p>Mã OTP của bạn là:</p>
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="color: #FF5500; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
                </div>
                <p style="color: #666;">Nhập mã này vào ứng dụng để đặt lại mật khẩu.</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    Mã OTP này sẽ hết hạn sau 10 phút.<br>
                    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateResetToken,
    generateOTP,
    sendPasswordResetEmail,
    sendOTPEmail
};
