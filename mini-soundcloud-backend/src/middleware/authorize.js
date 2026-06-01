const authorize = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Chưa xác thực'
            });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền truy cập. Yêu cầu role: ${requiredRole}`
            });
        }

        next();
    };
};

module.exports = authorize;