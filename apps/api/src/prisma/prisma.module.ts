import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // This makes PrismaService available everywhere without repeating imports
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // THIS IS THE KEY MISSING LINK
})
export class PrismaModule {}
