import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { StorageService } from '../storage/storage.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'your_jwt_secret', // TODO: In production, use an environment variable
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [StorageService, JwtStrategy],
  exports: [StorageService],
})
export class AuthModule {}