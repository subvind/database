import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocalAuthGuard } from '../auth/local-auth.guard';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('user')
  async createUser(@Body('username') username: string, @Body('password') password: string): Promise<string> {
    await this.storageService.createUser(username, password);
    return 'User created successfully';
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.storageService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('assign-db')
  async assignUserToDatabase(@Request() req, @Body('dbIndex') dbIndex: number): Promise<string> {
    await this.storageService.assignUserToDatabase(req.user.username, dbIndex);
    return 'User assigned to database successfully';
  }

  @UseGuards(JwtAuthGuard)
  @Post('rpush/:dbIndex/:key')
  async rpush(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string,
    @Body('values') values: string[]
  ): Promise<number> {
    return await this.storageService.rpush(req.user.username, Number(dbIndex), key, ...values);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lrange/:dbIndex/:key')
  lrange(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string,
    @Query('start') start: number,
    @Query('stop') stop: number,
  ): string[] {
    return this.storageService.lrange(req.user.username, Number(dbIndex), key, Number(start), Number(stop));
  }

  @UseGuards(JwtAuthGuard)
  @Post('lpop/:dbIndex/:key')
  async lpop(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string
  ): Promise<string | null> {
    return await this.storageService.lpop(req.user.username, Number(dbIndex), key);
  }

  @UseGuards(JwtAuthGuard)
  @Get('llen/:dbIndex/:key')
  llen(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string
  ): number {
    return this.storageService.llen(req.user.username, Number(dbIndex), key);
  }

  @UseGuards(JwtAuthGuard)
  @Post('snapshot')
  async createSnapshot(): Promise<string> {
    await this.storageService.triggerSnapshot();
    return 'Snapshot created successfully';
  }

  @UseGuards(JwtAuthGuard)
  @Post('set/:dbIndex/:key')
  async set(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string,
    @Body('value') value: string
  ): Promise<string> {
    return await this.storageService.set(req.user.username, Number(dbIndex), key, value);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/:dbIndex/:key')
  get(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string
  ): string | null {
    return this.storageService.get(req.user.username, Number(dbIndex), key);
  }

  @UseGuards(JwtAuthGuard)
  @Post('incr/:dbIndex/:key')
  async incr(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string
  ): Promise<number> {
    return await this.storageService.incr(req.user.username, Number(dbIndex), key);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sadd/:dbIndex/:key')
  async sadd(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string,
    @Body('members') members: string[]
  ): Promise<number> {
    return await this.storageService.sadd(req.user.username, Number(dbIndex), key, ...members);
  }

  @UseGuards(JwtAuthGuard)
  @Get('smembers/:dbIndex/:key')
  smembers(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string
  ): string[] {
    return this.storageService.smembers(req.user.username, Number(dbIndex), key);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sismember/:dbIndex/:key/:member')
  sismember(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string,
    @Param('member') member: string
  ): boolean {
    return this.storageService.sismember(req.user.username, Number(dbIndex), key, member);
  }

  @UseGuards(JwtAuthGuard)
  @Post('del/:dbIndex')
  async del(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Body('keys') keys: string[]
  ): Promise<number> {
    return await this.storageService.del(req.user.username, Number(dbIndex), ...keys);
  }

  @UseGuards(JwtAuthGuard)
  @Get('exists/:dbIndex')
  exists(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Query('keys') keys: string[]
  ): number {
    return this.storageService.exists(req.user.username, Number(dbIndex), ...keys);
  }

  @UseGuards(JwtAuthGuard)
  @Post('expire/:dbIndex/:key')
  async expire(
    @Request() req,
    @Param('dbIndex') dbIndex: number,
    @Param('key') key: string,
    @Body('seconds') seconds: number
  ): Promise<boolean> {
    return await this.storageService.expire(req.user.username, Number(dbIndex), key, seconds);
  }
}