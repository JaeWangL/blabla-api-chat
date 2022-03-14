import { registerAs } from '@nestjs/config';

export default registerAs(
  'kafka',
  (): Record<string, any> => ({
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
    consumerGroup: process.env.KAFKA_CONSUMER_GROUP || 'chat-api-consumer',
    clientId: process.env.KAFKA_CLIENT_ID || 'chat-api',
    key: process.env.KAFKA_KEY || '',
    secret: process.env.KAFKA_SECRET || '',
    retries: 3,
    timeout: 3000,
  }),
);
