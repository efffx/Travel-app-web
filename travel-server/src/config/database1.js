import mongoose from 'mongoose';
import config from './index.js';

let isConnected = false;

export const connectDB = async () => {
  if (config.nodeEnv === 'development') {
    try {
      const conn = await mongoose.connect(config.mongodb.uri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
      isConnected = true;
      console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
    } catch {
      console.warn('[DB] MongoDB not available, running without database');
      isConnected = false;
    }
    return;
  }
  const conn = await mongoose.connect(config.mongodb.uri);
  isConnected = true;
  console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
};

export const isDatabaseConnected = () => isConnected;
