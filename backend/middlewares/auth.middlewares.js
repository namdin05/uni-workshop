import { supabase } from '../utils/supabase.js';

// Middleware kiểm tra Token hợp lệ
export const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ message: 'Phiên đăng nhập hết hạn' });
    }

    req.user = user;
    next();
};

// Middleware kiểm tra quyền hạn (Role-Based)
export const authorizeRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Lấy role từ bảng users trong database của chúng ta
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('auth_id', req.user.id)
                .single();

            if (error || !data || !allowedRoles.includes(data.role)) {
                return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
            }

            next();
        } catch (err) {
            return res.status(500).json({ message: 'Lỗi kiểm tra quyền hạn' });
        }
    };
};