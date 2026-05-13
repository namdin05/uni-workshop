import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Pool } = pg;

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_KEY;
const databaseUrl = process.env.DATABASE_URL;

// Kiểm tra biến môi trường để tránh lỗi runtime khi deploy
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Thiếu cấu hình Supabase trong file .env');
}

if (!databaseUrl) {
  throw new Error('Thiếu DATABASE_URL trong file .env');
}

/**
 * 1. Supabase Client thông thường (Dành cho Sinh viên)
 * Sử dụng Anon Key để tuân thủ các chính sách Row Level Security (RLS).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false // Vì đây là Backend, chúng ta không cần lưu session vào localStorage
  }
});

/**
 * 2. Supabase Admin Client (Dành cho Ban tổ chức / Scripts hệ thống)
 * Sử dụng Service Role Key để vượt qua RLS.
 * Dùng cho các tác vụ như: Sync dữ liệu CSV, Quản trị viên xóa workshop.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * 3. PostgreSQL Direct Connection (PgBouncer via DATABASE_URL)
 * Dùng cho high-volume operations như workshop registration, user lookups.
 * PgBouncer giúp điều phối tải và quản lý connection pool hiệu quả.
 */
export const pgPool = new Pool({
  connectionString: databaseUrl,
  max: 20, // Số connection tối đa trong pool
  idleTimeoutMillis: 30000, // Đóng connection sau 30s idle
  connectionTimeoutMillis: 2000, // Timeout khi kết nối là 2s
});

// Handle pool errors
pgPool.on('error', (err) => {
  console.error('PostgreSQL Pool Error:', err);
});