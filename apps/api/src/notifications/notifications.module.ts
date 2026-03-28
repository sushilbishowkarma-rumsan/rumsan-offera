import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // ← add this import
import { RsOfficeModule } from '../rsoffice/rsoffice.module'; // provides RS_OFFICE_CLIENT

@Module({
  imports: [PrismaModule, AuthModule, RsOfficeModule],
  providers: [NotificationsGateway, NotificationsService, WsJwtGuard],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
