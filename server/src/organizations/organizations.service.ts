import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateOrganizationDto) {
    return this.prisma.organization.create({ data });
  }

  findAll() {
    return this.prisma.organization.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const org = await this.prisma.organization.findUnique({
      where: { organization_id: id },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async update(id: number, data: UpdateOrganizationDto) {
    await this.findOne(id);

    return this.prisma.organization.update({
      where: { organization_id: id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.organization.delete({
      where: { organization_id: id },
    });
  }
}