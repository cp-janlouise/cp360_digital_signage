import { PrismaService } from '../../prisma/prisma.service.js';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        email: string;
        name?: string;
    }): any;
    findAll(): any;
    findOne(id: string): any;
    remove(id: string): any;
}
