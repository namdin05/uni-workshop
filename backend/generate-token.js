import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000'; // Nhớ đảm bảo Backend đang chạy
const TOTAL_STUDENTS = 20;
const BATCH_SIZE = 20; // Giảm xuống 20 request/lô để không bị Supabase Auth block
const SLEEP_MS = 1000;  // Nghỉ 1 giây giữa các lô

const tokens = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateTokens() {
  let studentId = 23120001;

  for (let i = 0; i < TOTAL_STUDENTS; i += BATCH_SIZE) {
    const promises = [];

    for (let j = i; j < i + BATCH_SIZE && j < TOTAL_STUDENTS; j++) {
      const currentId = studentId++;

      promises.push(
        (async () => {
          try {
            const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
              email: `${currentId}@student.hcmus.edu.vn`,
              password: '111111',
            });

            // SỬA Ở ĐÂY: Chỉ push chuỗi token để k6 đọc được ngay
            tokens.push(loginRes.data.token);

            console.log(`✅ [${tokens.length}/${TOTAL_STUDENTS}] Token generated for ${currentId}`);
          } catch (err) {
            console.log(`❌ Error student ${currentId}:`, err.response?.data?.message || err.message);
          }
        })()
      );
    }

    await Promise.all(promises);
    console.log(`⏳ Batch ${Math.floor(i / BATCH_SIZE) + 1} completed. Sleeping for ${SLEEP_MS}ms...`);
    await sleep(SLEEP_MS);
  }

  // Lưu file JSON
  fs.writeFileSync('./tokens.json', JSON.stringify(tokens, null, 2));

  console.log(`🎉 DONE! Saved ${tokens.length} tokens to tokens.json`);
}

generateTokens();