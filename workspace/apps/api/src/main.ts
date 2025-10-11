/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    return client;
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1); // Exit if database connection fails
  }
}

async function bootstrap() {
  // Connect to MongoDB before starting Nest
  await connectDB();

  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}
