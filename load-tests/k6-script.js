import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '2m',
};

export default function () {
  const base = __ENV.BASE_URL || 'https://chat.example.com';
  const res = http.get(`${base}/api/users`);
  check(res, {
    'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  sleep(1);
}
