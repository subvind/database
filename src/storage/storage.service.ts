import { Injectable, OnModuleInit, OnModuleDestroy, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs/promises';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

interface User {
  username: string;
  passwordHash: string;
  databases: number[];
  isAdmin: boolean;
}

@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
  private databases: Map<number, Map<string, any>> = new Map();
  private users: Map<string, User> = new Map();
  private walFile: string = 'data/wal.log';
  private snapshotFile: string = 'data/snapshot.json';
  private usersFile: string = 'data/users.json';
  private walStream: fs.FileHandle | null = null;

  constructor(private jwtService: JwtService) {}

  async onModuleInit() {
    await this.loadSnapshot();
    await this.loadUsers();
    await this.replayWAL();
    this.walStream = await fs.open(this.walFile, 'a');
  }

  async onModuleDestroy() {
    await this.createSnapshot();
    await this.saveUsers();
    await this.walStream?.close();
  }

  private async loadSnapshot() {
    try {
      const data = await fs.readFile(this.snapshotFile, 'utf-8');
      const parsedData = JSON.parse(data);
      this.databases = new Map(Object.entries(parsedData).map(([key, value]) => [Number(key), new Map(Object.entries(value))]));
    } catch (error) {
      console.log('No snapshot found or error loading snapshot');
    }
  }

  private async loadUsers() {
    try {
      const data = await fs.readFile(this.usersFile, 'utf-8');
      const parsedData = JSON.parse(data);
      this.users = new Map(Object.entries(parsedData));
    } catch (error) {
      console.log('No users file found or error loading users');
    }
  }

  private async replayWAL() {
    try {
      const data = await fs.readFile(this.walFile, 'utf-8');
      const lines = data.split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        const [operation, ...args] = JSON.parse(line);
        switch (operation) {
          case 'set':
            this.set(args[0], Number(args[1]), args[2], args[3]);
            break;
          case 'incr':
            this.incr(args[0], Number(args[1]), args[2]);
            break;
          case 'sadd':
            this.sadd(args[0], Number(args[1]), args[2], ...args.slice(3));
            break;
          case 'del':
            this.del(args[0], Number(args[1]), ...args.slice(2));
            break;
          case 'expire':
            this.expire(args[0], Number(args[1]), args[2], Number(args[3]));
            break;
          case 'rpush':
            this.rpush(args[0], Number(args[1]), args[2], ...args.slice(3));
            break;
          case 'lpop':
            this.lpop(args[0], Number(args[1]), args[2]);
            break;
        }
      }
    } catch (error) {
      console.log('No WAL found or error replaying WAL');
    }
  }

  private async appendToWAL(operation: string, ...args: any[]) {
    const logEntry = JSON.stringify([operation, ...args]) + '\n';
    await this.walStream?.write(logEntry);
  }

  private async createSnapshot() {
    const snapshotData = JSON.stringify(Object.fromEntries(Array.from(this.databases.entries()).map(([key, value]) => [key, Object.fromEntries(value)])));
    await fs.writeFile(this.snapshotFile, snapshotData);
    await fs.truncate(this.walFile, 0);
  }

  private async saveUsers() {
    const userData = JSON.stringify(Object.fromEntries(this.users));
    await fs.writeFile(this.usersFile, userData);
  }

  async createUser(username: string, password: string): Promise<void> {
    if (this.users.has(username)) {
      throw new Error('User already exists');
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    let isAdmin: boolean = false;
    if (process.env.ADMIN) {
      if (process.env.ADMIN === username) {
        isAdmin = true;
      }
    } else {
      if (username === 'root') {
        isAdmin = true
      }
    }
    const newUser: User = {
      username,
      passwordHash,
      databases: [],
      isAdmin
    };
    this.users.set(username, newUser);
    await this.saveUsers();
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = this.users.get(username);
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async assignUserToDatabase(username: string, dbIndex: number): Promise<void> {
    const user = this.users.get(username);
    if (!user) throw new Error('User not found');
    if (!user.databases.includes(dbIndex)) {
      user.databases.push(dbIndex);
      await this.saveUsers();
    }
  }

  private getDatabase(dbIndex: number): Map<string, string[]> {
    if (!this.databases.has(dbIndex)) {
      this.databases.set(dbIndex, new Map());
    }
    return this.databases.get(dbIndex)!;
  }

  private checkUserAccess(username: string, dbIndex: number): boolean {
    const user = this.users.get(username);
    return user ? user.databases.includes(dbIndex) : false;
  }

  async rpush(username: string, dbIndex: number, key: string, ...values: string[]): Promise<number> {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    if (!db.has(key)) {
      db.set(key, []);
    }
    const list = db.get(key)!;
    list.push(...values);
    await this.appendToWAL('rpush', username, dbIndex, key, ...values);
    return list.length;
  }

  lrange(username: string, dbIndex: number, key: string, start: number, stop: number): string[] {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    const list = db.get(key) || [];
    if (start < 0) start = Math.max(list.length + start, 0);
    if (stop < 0) stop = Math.max(list.length + stop, 0);
    stop = Math.min(stop, list.length - 1);
    return list.slice(start, stop + 1);
  }

  async lpop(username: string, dbIndex: number, key: string): Promise<string | null> {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    const list = db.get(key);
    if (!list || list.length === 0) {
      return null;
    }
    const item = list.shift()!;
    await this.appendToWAL('lpop', username, dbIndex, key);
    return item;
  }

  llen(username: string, dbIndex: number, key: string): number {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    return db.get(key)?.length || 0;
  }

  // String Operations
  async set(username: string, dbIndex: number, key: string, value: string): Promise<'OK'> {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    db.set(key, [value]); // Store value as an array
    await this.appendToWAL('set', username, dbIndex, key, value);
    return 'OK';
  }

  get(username: string, dbIndex: number, key: string): string | null {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    const value = db.get(key);
    return Array.isArray(value) ? value[0] : null;
  }

  async incr(username: string, dbIndex: number, key: string): Promise<number> {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    let value = db.get(key);
    if (!value) {
      value = ['0'];
    } else if (!Array.isArray(value) || typeof Number(value[0]) !== 'number') {
      throw new Error('Value is not a number');
    }
    let number = Number(value[0]) + 1;
    value[0] = `${number}`;
    db.set(key, value);
    await this.appendToWAL('incr', username, dbIndex, key);
    return number;
  }

  async sadd(username: string, dbIndex: number, key: string, ...members: string[]): Promise<number> {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    let set = db.get(key);
    if (!set || !Array.isArray(set)) {
      set = [];
      db.set(key, set);
    }
    const initialSize = set.length;
    members.forEach(member => {
      if (!set.includes(member)) {
        set.push(member);
      }
    });
    const addedCount = set.length - initialSize;
    await this.appendToWAL('sadd', username, dbIndex, key, ...members);
    return addedCount;
  }

  smembers(username: string, dbIndex: number, key: string): string[] {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    const set = db.get(key);
    return set instanceof Set ? Array.from(set) : [];
  }

  sismember(username: string, dbIndex: number, key: string, member: string): boolean {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    const set = db.get(key);
    return set instanceof Set ? set.has(member) : false;
  }

  // Key Management
  async del(username: string, dbIndex: number, ...keys: string[]): Promise<number> {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    let count = 0;
    for (const key of keys) {
      if (db.delete(key)) {
        count++;
      }
    }
    await this.appendToWAL('del', username, dbIndex, ...keys);
    return count;
  }

  exists(username: string, dbIndex: number, ...keys: string[]): number {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    return keys.filter(key => db.has(key)).length;
  }

  async expire(username: string, dbIndex: number, key: string, seconds: number): Promise<boolean> {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    if (!db.has(key)) {
      return false;
    }
    setTimeout(() => {
      db.delete(key);
    }, seconds * 1000);
    await this.appendToWAL('expire', username, dbIndex, key, seconds);
    return true;
  }

  async triggerSnapshot(): Promise<void> {
    await this.createSnapshot();
    await this.saveUsers();
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async generateSnapshot() {
    console.log('Generating snapshot...');
    await this.createSnapshot();
    await this.saveUsers();
    console.log('Snapshot generated successfully.');
  }

  async deleteDatabase(username: string, dbIndex: number): Promise<void> {
    const user = this.users.get(username);
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.databases.includes(dbIndex)) throw new ForbiddenException('User does not have access to this database');

    this.databases.delete(dbIndex);
    user.databases = user.databases.filter(db => db !== dbIndex);
    await this.saveUsers();
    await this.appendToWAL('deleteDatabase', username, dbIndex);
  }

  async getDatabaseInfo(username: string, dbIndex: number): Promise<any> {
    if (!this.checkUserAccess(username, dbIndex)) {
      throw new UnauthorizedException('User does not have access to this database');
    }
    const db = this.getDatabase(dbIndex);
    return {
      keyCount: db.size,
      sizeInBytes: JSON.stringify(Array.from(db)).length,
    };
  }

  async getUserInfo(username: string): Promise<any> {
    const user = this.users.get(username);
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash, ...userInfo } = user;
    return userInfo;
  }

  async listDatabases(username: string): Promise<number[]> {
    const user = this.users.get(username);
    if (!user) throw new UnauthorizedException('User not found');
    return user.databases;
  }

  async listUsers(username: string): Promise<string[]> {
    const user = this.users.get(username);
    if (!user || !user.isAdmin) throw new UnauthorizedException('Unauthorized');
    return Array.from(this.users.keys());
  }
}