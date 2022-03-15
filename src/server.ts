import FastifyHelmet from 'fastify-helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DatabaseService } from './database/database_service';
import { AppModule } from './app_module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const configService = app.get(ConfigService);
  const env: string = configService.get<string>('app.env');
  const tz: string = configService.get<string>('app.timezone');
  const host: string = configService.get<string>('app.http.host');
  const port: number = configService.get<number>('app.http.port');
  const logger = new Logger();
  process.env.TZ = tz;
  process.env.NODE_ENV = env;

  app.useGlobalPipes(new ValidationPipe());
  app.register(FastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  });
  app.register(FastifyHelmet, {
    contentSecurityPolicy: false,
  });
  app.setGlobalPrefix('/api');

  const dbService: DatabaseService = app.get(DatabaseService);
  dbService.enableShutdownHooks(app);

  await app.listen(port, host);
  logger.log(`Server running on ${await app.getUrl()}`, 'NestApplication');
}

bootstrap();
