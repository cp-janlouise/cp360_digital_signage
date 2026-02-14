import { Injectable, OnModuleInit } from '@nestjs/common';
import * as PrismaPkg from '@prisma/client';

const PrismaClient = (PrismaPkg as any).PrismaClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly client = new PrismaClient();

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  get prisma() {
    return this.client;
  }
}

