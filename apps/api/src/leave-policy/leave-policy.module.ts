// backend/src/leave-policy/leave-policy.module.ts

import { Module } from '@nestjs/common';
import { LeavePolicyController } from './leave-policy.controller';
import { LeavePolicyService } from './leave-policy.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // ← add this import

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LeavePolicyController],
  providers: [LeavePolicyService],
  exports: [LeavePolicyService], // export if other modules need it
})
export class LeavePolicyModule {}
