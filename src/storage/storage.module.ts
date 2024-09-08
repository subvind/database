import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  imports: [
  ],
  providers: [StorageService],
  controllers: [StorageController],
  exports: [],
})
export class StorageModule {}