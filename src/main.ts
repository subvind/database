import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(6969);
  console.log('Database is running: http://localhost:6969');
}
bootstrap();
