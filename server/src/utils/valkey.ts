import Valkey from 'iovalkey';

// Valkey uses the same protocol as Redis, so we can use the ioredis client.
// Connection details should come from environment variables for flexibility.
const valkeyUrl = process.env.VALKEY_URL || 'valkey://localhost:6379';

console.log(`Attempting to connect to Valkey at ${valkeyUrl}...`);

export const valkey = new Valkey(valkeyUrl, {
  maxRetriesPerRequest: 5,
  // Prevents ioredis from hanging the process if it can't connect
  enableOfflineQueue: false,
  connectTimeout: 10000, // 10 seconds connection timeout
  retryStrategy: (times: number) => {
    // Exponential backoff, max 30s
    const delay = Math.min(times * 2000, 30000);
    console.warn(`Valkey reconnect attempt #${times}, retrying in ${delay}ms...`);
    return delay;
  },
});

valkey.on('connect', () => {
  console.log('✅ Successfully connected to Valkey server!');
});

valkey.on('error', (err: any) => {
  console.error('❌ Could not connect to Valkey server:', err.message);
});

// export default valkey;
