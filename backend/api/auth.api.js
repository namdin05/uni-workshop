import { supabase, supabaseAdmin } from '../utils/supabase.js';

const loadUserProfile = async (authId) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, student_id, role')
        .eq('auth_id', authId)
        .single();

    if (error) throw error;

    return data;
};

export const register = async (req, res) => {
    const { email, password, fullName, studentId } = req.body;

    try {
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (checkError || !existingUser) {
            return res.status(403).json({ 
                message: 'Email của bạn không thuộc hệ thống nhà trường. Vui lòng liên hệ phòng Đào tạo!' 
            });
        }

        if (existingUser.auth_id) {
            return res.status(400).json({ 
                message: 'Tài khoản này đã được đăng ký. Vui lòng chuyển sang trang Đăng nhập!' 
            });
        }
        // 1. Tạo tài khoản trong Supabase Auth (Trả về UUID)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

        // 2. Lưu vào bảng users (id sẽ tự tăng, auth_id lưu UUID)
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({
                auth_id: authData.user.id,
                full_name: fullName || existingUser.full_name,
            })
            .eq('id', existingUser.id);

        if (dbError) throw dbError;

        const profile = await loadUserProfile(authData.user.id);

        return res.status(201).json({
            message: 'Đăng ký thành công!',
            user: authData.user,
            profile,
            token: authData.session?.access_token ?? null,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        const profile = await loadUserProfile(data.user.id);

        return res.status(200).json({
            message: 'Đăng nhập thành công',
            token: data.session.access_token,
            user: data.user,
            profile,
        });
    } catch (error) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }
};

export const validateActivation = async (req, res) => {
    try {
        const { studentId, email } = req.body;

        if (!studentId || !email) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã số sinh viên và email' });
        }

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, student_id, email, full_name, auth_id')
            .eq('student_id', studentId)
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: 'Thông tin sinh viên không tồn tại' });
        }

        if (user.auth_id !== null) {
            return res.status(409).json({ message: 'Tài khoản đã được kích hoạt trước đó' });
        }

        return res.status(200).json({ message: 'Sinh viên tồn tại', user: { id: user.id, student_id: user.student_id, email: user.email, full_name: user.full_name } });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const activateAccount = async (req, res) => {
    try {
        const { studentId, email, password, confirmPassword } = req.body;

        if (!studentId || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
        }

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, student_id, email, full_name, auth_id')
            .eq('student_id', studentId)
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: 'Thông tin sinh viên không tồn tại' });
        }

        if (user.auth_id !== null) {
            return res.status(409).json({ message: 'Tài khoản đã được kích hoạt' });
        }

        // Create the auth user using the service role key
        const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password,
            user_metadata: { full_name: user.full_name },
            email_confirm: true,
        });

        if (createError || !created) {
            return res.status(500).json({ message: createError?.message || 'Không thể tạo tài khoản' });
        }

        const newAuthId = created.user?.id ?? created.id ?? null;

        if (!newAuthId) {
            return res.status(500).json({ message: 'Không nhận được auth id từ Supabase' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ auth_id: newAuthId })
            .eq('id', user.id);

        if (updateError) {
            return res.status(500).json({ message: updateError.message });
        }

        return res.status(201).json({ message: 'Kích hoạt tài khoản thành công' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};