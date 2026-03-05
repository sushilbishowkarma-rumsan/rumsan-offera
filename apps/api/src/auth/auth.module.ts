// import { JwtModule } from '@nestjs/jwt';
// import { JwtStrategy } from './strategies/jwt.strategy';

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';
import { JwtAuthGuard } from './guards/roles.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, CryptoService, JwtAuthGuard],
  exports: [CryptoService, JwtAuthGuard],
  // imports: [
  //   JwtModule.register({
  //     global: true,
  //     secret: process.env.JWT_SECRET,
  //     signOptions: { expiresIn: '7d' }, // Token valid for 7 day
  //   }),
  //],

  // controllers: [AuthController],
  // providers: [AuthService, PrismaService, JwtStrategy], // ← JwtStrategy must be here
  // exports: [JwtModule],
})
export class AuthModule {}
