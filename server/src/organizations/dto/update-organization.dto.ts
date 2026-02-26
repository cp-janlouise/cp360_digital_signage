import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizationDto } from '../dto/create-organization.dto.js';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}
