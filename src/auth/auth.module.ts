import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    PassportModule,
    StorageModule,
  ],
  providers: [JwtStrategy, LocalStrategy],
})
export class AuthModule {}