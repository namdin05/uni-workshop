import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Metrics
export const registrationSuccessRate = new Rate('registration_success');
export const registrationDuration = new Trend('registration_duration_ms');
export const systemDefended = new Counter('system_defended_429');
export const failedRegistrations = new Counter('failed_registrations');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// THAY ĐỔI 1: Khai báo danh sách các Workshop đang mở đăng ký
// Bạn nhớ thay các ID này bằng ID thật trong Database của bạn nhé!
const WORKSHOP_IDS = [
  '1',
  '2',
  '3',
  '4',
  '5'
];

const tokens = JSON.parse(open('./tokens.json')); 

export const options = {
  scenarios: {
    registration_spike: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s', 
      preAllocatedVUs: 500,
      maxVUs: 2000, 
      stages: [
        { target: 50, duration: '30s' },
        { target: 50, duration: '1m30s' },
        { target: 20, duration: '1m' }, 
        { target: 10, duration: '3m' },
        { target: 10, duration: '3m' },
        { target: 0, duration: '1m' },
      ],
    },
  },
  thresholds: {
    'registration_duration_ms': ['p(95) < 2000'], 
    'failed_registrations': ['count < 120'], 
  },
};

export default function () {
  const token = tokens[Math.floor(Math.random() * tokens.length)]; 

  // THAY ĐỔI 2: Chọn ngẫu nhiên 1 workshop cho sinh viên này
  const targetWorkshopId = WORKSHOP_IDS[Math.floor(Math.random() * WORKSHOP_IDS.length)];

  const payload = JSON.stringify({
    workshopId: targetWorkshopId, // Gắn ID vừa bốc được vào payload
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-load-test-bypass': 'unihub-super-secret-bypass', // Bỏ qua chặn IP
    },
    // THAY ĐỔI 3: Gắn thêm tag workshop_id để phân tích dữ liệu sau khi test
    tags: { 
        name: 'RegisterWorkshop',
        workshop: targetWorkshopId 
    },
  };

  const startTime = new Date();
  const response = http.post(`${BASE_URL}/api/workshops/register`, payload, params);
  const duration = new Date() - startTime;

  registrationDuration.add(duration);

  const success = check(response, {
    'status is 200 (Success)': (r) => r.status === 200,
    'status is 400 (Workshop Full)': (r) => r.status === 400,
    'status is 429 (Rate Limited)': (r) => r.status === 429,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  if (response.status === 200 || response.status === 400) {
    registrationSuccessRate.add(true);
  } else if (response.status === 429) {
    systemDefended.add(1); 
  } else {
    registrationSuccessRate.add(false);
    failedRegistrations.add(1);
    // Log ra rõ ràng là user đang cố đăng ký workshop nào thì bị lỗi
    console.error(`LỖI HỆ THỐNG (Workshop ${targetWorkshopId}): ${response.status} - ${response.body}`);
  }
}