import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' }, // Token valid for 7 day
    }),
  ],

  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy], // ← JwtStrategy must be here
  exports: [JwtModule],
})
export class AuthModule {}
