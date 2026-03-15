// exceeded-leave/exceeded-leave.module.ts
// Place this file at: src/exceeded-leave/exceeded-leave.module.ts

import { Module } from '@nestjs/common';
import { ExceededLeaveController } from './exceeded-leave.controller';
import { ExceededLeaveService } from './exceeded-leave.service';
import { PrismaModule } from '../prisma/prisma.module';
// ─── Import your existing NotificationsModule ─────────────────────────────────
// Adjust the import path to match your project structure
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule, // ← required so NotificationsService can be injected
  ],
  controllers: [ExceededLeaveController],
  providers: [ExceededLeaveService],
  exports: [ExceededLeaveService], // ← export so LeaveBalanceModule can use it
})
export class ExceededLeaveModule {}
