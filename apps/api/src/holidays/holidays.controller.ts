import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  // Public — everyone can read holidays (employees need this too)
  @Get()
  findAll() {
    return this.holidaysService.findAll();
  }

  // Admin only — create
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateHolidayDto) {
    return this.holidaysService.create(dto);
  }

  // Admin only — delete
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.holidaysService.remove(id);
  }
}
