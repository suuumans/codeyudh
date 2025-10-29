import Valkey from 'iovalkey';

const valkeyUrl = process.env.VALKEY_URL || 'valkey://localhost:6379';

const valkeyOptions = {
  maxRetriesPerRequest: 5,
  // Prevents iovalkey from hanging the process if it can't connect
  enableOfflineQueue: false,
  connectTimeout: 10000, // 10 seconds connection timeout
  retryStrategy: (times: number) => {
    // Exponential backoff, max 10s
    const delay = Math.min(times * 2000, 10000);
    console.warn(`Valkey reconnect attempt #${times}, retrying in ${delay}ms...`);
    return delay;
  },
};

console.log(`Attempting to connect to Valkey at ${valkeyUrl}...`);

export const valkey = new Valkey(valkeyUrl, valkeyOptions);

valkey.on('connect', () => console.log('✅ Successfully connected to Valkey server!'));
valkey.on('error', (err: Error) => console.error('❌ Valkey connection error:', err.message));

/**
 * Gracefully disconnects from the Valkey server.
 * Call this function on application shutdown.
 */
export const disconnectValkey = async () => {
  if (valkey.status === 'ready' || valkey.status === 'connecting') {
    console.log('🔌 Disconnecting from Valkey server...');
    await valkey.quit();
    console.log('✅ Successfully disconnected from Valkey.');
  }
};