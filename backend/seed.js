import db from './config/database.js';

async function seed() {
  try {
    console.log('Đang tạo phòng...');
    const [room] = await db('rooms').insert({
      name: 'Phòng Lab Thực Hành',
      capacity: 50
    }).returning('id');

    console.log('Đang tạo Workshop...');
    await db('workshops').insert([
      {
        title: 'Workshop AI & NLP cơ bản',
        description: 'Hướng dẫn tích hợp AI vào ứng dụng web.',
        speaker_name: 'Tăng Nhật Minh',
        room_id: room.id,
        is_free: true,
        price: 0,
        total_seats: 50,
        available_seats: 50,
        // Chú ý: Nếu code báo lỗi ở dòng status này, hãy hỏi bạn cùng nhóm xem Enum của status là gì nhé!
        status: 'published' 
      }
    ]);

    console.log('🎉 Đã thêm dữ liệu mẫu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error.message);
    process.exit(1);
  }
}

seed();