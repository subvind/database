import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    PassportModule,
    StorageModule,
  ],
  providers: [JwtStrategy],
})
export class AuthModule {}