import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';


@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

  create(data: { email: string; name?: string }) {
    return this.prisma.user.create({ data });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
