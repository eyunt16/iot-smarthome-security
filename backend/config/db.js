const mongoose = require('mongoose');

let isShutdownHandlerRegistered = false;
let areConnectionListenersRegistered = false;

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('Missing required environment variable: MONGODB_URI');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    return mongoose.connection.asPromise();
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production',
    maxPoolSize: 25,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
  });

  if (!isShutdownHandlerRegistered) {
    const gracefulShutdown = async (signal) => {
      try {
        await mongoose.connection.close(false);
        console.info(`MongoDB connection closed on ${signal}`);
        process.exit(0);
      } catch (error) {
        console.error(`MongoDB shutdown error on ${signal}:`, error);
        process.exit(1);
      }
    };

    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    isShutdownHandlerRegistered = true;
  }

  if (!areConnectionListenersRegistered) {
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    areConnectionListenersRegistered = true;
  }

  console.info(`MongoDB connected: ${connection.connection.host}`);
  return connection.connection;
}

async function disconnectDB() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.close(false);
}

module.exports = {
  connectDB,
  disconnectDB,
  mongoose,
};
