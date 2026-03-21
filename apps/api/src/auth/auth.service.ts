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

interface DecodedTokenPayload {
  sub: string; // rsoffice cuid
  app: string; // rsoffice app id
  roles: string[];
  email: string;
  org_unit: string;
  department: string;
  manager_cuid: string;
  iat: number;
  exp: number;
}

interface RsOfficeUser {
  cuid: string;
  name: string;
  email: string;
  gender: string | null;
  active: boolean;
  pending_approval: boolean;
  is_admin: boolean;
  org_unit: string | null;
  job_title: string | null;
  department: string | null;
  employment_type: string | null;
  phone_work: string | null;
  phone_home: string | null;
  phone_recovery: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

interface GoogleData {
  sub: string;
  given_name: string;
  family_name: string;
  picture: string;
}

interface AuthResult {
  user: RsOfficeUser;
  google: GoogleData;
  roles: string[];
  token: string;
}

/**
 * Decodes a JWT token without verifying the signature.
 * Verification is handled by RsOffice — we just need the payload data.
 */
function decodeJwtPayload(token: string): DecodedTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json) as DecodedTokenPayload;
  } catch {
    return null;
  }
}

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
    // ── Step B: RsOffice 3-step challenge flow to get RsOffice JWT ──
    const { challenge } = await this.rsClient.auth.getChallenge({
      appId: this.appId,
    });

    const appSignature = this.crypto.signChallenge(challenge);

    const rsAuthResult = (await this.rsClient.auth.googleLogin(
      { id_token: token, challenge, app_signature: appSignature },
      { appId: this.appId },
    )) as AuthResult;

    const decodedToken = decodeJwtPayload(rsAuthResult.token);

    const { user: rsUser, google: rsGoogle } = rsAuthResult;

    // const { email, name } = rsAuthResult.user;
    // const { picture: avatar } = rsAuthResult.google;
    // cuid is the canonical RsOffice user identifier — use as primary lookup
    const rsofficeId = rsUser.cuid;

    const role = rsAuthResult.roles[0] || 'EMPLOYEE';

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
      where: { rsofficeId },
      select: { id: true },
    });

    const isNewUser = !existingUser;
    // Upsert: Create user if new, Update if exists
    const savedUser = await this.prisma.user.upsert({
      where: { rsofficeId },
      update: {
        email: rsUser.email,
        name: rsUser.name,
        avatar: rsUser.thumbnail_url,
        googleId: rsGoogle.sub,
        role: assignedRole,
        // RsOffice profile fields
        gender: rsUser.gender,
        active: rsUser.active,
        orgUnit: rsUser.org_unit,
        jobTitle: rsUser.job_title,
        department: rsUser.department,
        employmentType: rsUser.employment_type,
        phoneWork: rsUser.phone_work,
        phoneHome: rsUser.phone_home,
        phoneRecovery: rsUser.phone_recovery,
        // Token-decoded fields
        managerCuid: decodedToken?.manager_cuid ?? null,
      },
      create: {
        // Core identity
        rsofficeId,
        googleId: rsGoogle.sub,
        email: rsUser.email,
        name: rsUser.name,
        avatar: rsUser.thumbnail_url,
        role: assignedRole,
        // RsOffice profile fields
        gender: rsUser.gender,
        active: rsUser.active,
        orgUnit: rsUser.org_unit,
        jobTitle: rsUser.job_title,
        department: rsUser.department,
        employmentType: rsUser.employment_type,
        phoneWork: rsUser.phone_work,
        phoneHome: rsUser.phone_home,
        phoneRecovery: rsUser.phone_recovery,
        // Token-decoded fields
        managerCuid: decodedToken?.manager_cuid ?? null,
      },
    });

    if (isNewUser) {
      await this.seedDefaultLeaveBalances(savedUser.id);
    }
    return {
      user: savedUser,
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
  }
}
