import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { CustomLogger } from './logger/custom-logger';

async function bootstrap(logger: CustomLogger) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });
  await app.listen(6969);
  console.log('Database is running: http://localhost:6969');
}

// Create the CustomLogger with the AmqpConnection
const logger = new CustomLogger('Bootstrap');

bootstrap(logger);
