import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';

@Injectable()
export class HolidaysService {
  constructor(private prisma: PrismaService) {}

  // Get all holidays, sorted by date asc
  async findAll() {
    return this.prisma.publicHoliday.findMany({
      orderBy: { date: 'asc' },
    });
  }

  // Create a new holiday
  async create(dto: CreateHolidayDto) {
    return this.prisma.publicHoliday.create({
      data: {
        name: dto.name.trim(),
        date: new Date(dto.date),
        isOptional: dto.isOptional ?? false,
      },
    });
  }

  // Delete a holiday by id
  async remove(id: string) {
    const exists = await this.prisma.publicHoliday.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Holiday not found');
    return this.prisma.publicHoliday.delete({ where: { id } });
  }
}
