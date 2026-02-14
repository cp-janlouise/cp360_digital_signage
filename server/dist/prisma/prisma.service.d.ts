import { OnModuleInit } from '@nestjs/common';
declare const PrismaClient: any;
export declare class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly client;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get prisma(): any;
}
export {};
