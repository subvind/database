import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private storageService: StorageService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.storageService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}