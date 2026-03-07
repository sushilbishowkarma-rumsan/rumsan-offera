import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';
import { JwtAuthGuard, RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    RolesGuard,
    CryptoService,
    JwtAuthGuard,
  ],
  exports: [CryptoService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
