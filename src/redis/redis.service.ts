import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
@Injectable()
export class RedisService {
  private readonly client: Redis;
  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }
  getClient(): Redis {
    return this.client;
  }

  async save(key: string, value: number, expiresInSec?: number) {
    if (expiresInSec) {
      await this.client.setex(key, expiresInSec, value);
    } else {
      await this.client.setex(key, 32 * 3600, value); // 32h expire
    }
  }

  async getValue(key: string): Promise<string | null> {
    const value = await this.client.get(key);
    return value;
  }
}
