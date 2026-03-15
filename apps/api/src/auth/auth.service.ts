import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CryptoService } from './crypto.service';
import { RS_OFFICE_CLIENT } from '../rsoffice/rsoffice.module';
import type { RsOfficeClient } from '@rumsan/user';

const DEFAULT_LEAVE_TYPES = [
  'SICK',
  'PERSONAL',
  'PATERNITY',
  'EMERGENCY',
] as const;

@Injectable()
export class AuthService {
  private readonly appId: string;

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService, //new added
    @Inject(RS_OFFICE_CLIENT) private readonly rsClient: RsOfficeClient,
  ) {
    const appId = process.env.APP_ID;
    if (!appId) throw new Error('APP_ID env var is required');
    this.appId = appId;
  }

  async validateGoogleUser(token: string) {
    interface GoogleData {
      sub: string;
      given_name: string;
      family_name: string;
      picture: string;
    }

    interface AuthResult {
      user: { email: string; name: string; cuid: string };
      google: GoogleData;
      roles: string[];
      token: string;
    }

    // ── Step B: RsOffice 3-step challenge flow to get RsOffice JWT ──
    const { challenge } = await this.rsClient.auth.getChallenge({
      appId: this.appId,
    });
    // console.log('Received challenge from RsOffice API:', challenge);
    const appSignature = this.crypto.signChallenge(challenge);
    // console.log('Generated app signature for challenge:', appSignature);
    const rsAuthResult = (await this.rsClient.auth.googleLogin(
      { id_token: token, challenge, app_signature: appSignature },
      { appId: this.appId },
    )) as AuthResult;

    console.log('RsOffice API returned from googleLogin:', rsAuthResult);
    const { email, name } = rsAuthResult.user;
    const { picture: avatar } = rsAuthResult.google;
    const role = rsAuthResult.roles[0] || 'EMPLOYEE';

    // ── Step C: Save/update user in your own Prisma DB ──
    // const HR_ADMIN_EMAILS = [
    //   'sushil.bishowkarma@rumsan.net',
    //   'anusha.thapa@rumsan.net',
    // ];
    // const isHardcodedAdmin = HR_ADMIN_EMAILS.includes(email.toLowerCase());
    let assignedRole: Role;
    if (role === 'env_admin' || role === 'app_admin') {
      assignedRole = 'HRADMIN';
    } else {
      // const existingUser = await this.prisma.user.findUnique({
      //   where: { email },
      // });
      // assignedRole = existingUser ? existingUser.role : (role as Role);
      assignedRole = role as Role;
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    const isNewUser = !existingUser;
    // Upsert: Create user if new, Update if exists
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        name,
        avatar,
        role: assignedRole,
        rsofficeId: rsAuthResult.user.cuid,
      },
      create: {
        googleId: rsAuthResult.google.sub,
        rsofficeId: rsAuthResult.user.cuid,
        email,
        name,
        avatar,
        role: assignedRole,
      },
    });

    if (isNewUser) {
      await this.seedDefaultLeaveBalances(user.id);
    }
    return {
      user,
      access_token: rsAuthResult.token, // ← RsOffice JWT (ES256K signed)
    };
  }
  private async seedDefaultLeaveBalances(employeeId: string): Promise<void> {
    // Fetch only the 4 default policy types that exist in the DB.
    // If a policy hasn't been created by HR yet, we skip it gracefully
    // (the balance will be created when HR assigns a quota manually).
    const policies = await this.prisma.leavePolicy.findMany({
      where: {
        leaveType: { in: [...DEFAULT_LEAVE_TYPES] },
        isActive: true,
      },
      select: { id: true, leaveType: true },
    });

    if (policies.length === 0) {
      console.warn(
        `[AuthService] No default leave policies found for types: ${DEFAULT_LEAVE_TYPES.join(', ')}. ` +
          `New employee ${employeeId} will have no leave balances until HR creates those policies.`,
      );
      return;
    }
    await this.prisma.leaveBalance.createMany({
      data: policies.map((policy) => ({
        employeeId,
        leaveType: policy.leaveType,
        total: 0, // ← HR sets the real value later via /leave-balances/employee/:id/quota
        remaining: 0,
        leavePolicyId: policy.id,
      })),
      skipDuplicates: true,
    });

    console.log(
      `[AuthService] Seeded ${policies.length} default leave balances (quota=0) for new employee ${employeeId}`,
    );
  }
}
