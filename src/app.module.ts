import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    StorageModule,
    AuthModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}