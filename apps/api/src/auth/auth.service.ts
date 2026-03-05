import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CryptoService } from './crypto.service';
import { RS_OFFICE_CLIENT } from '../rsoffice/rsoffice.module';
import type { RsOfficeClient } from '@rumsan/user';

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

    const { email, name } = rsAuthResult.user;
    const { picture: avatar } = rsAuthResult.google;
    const role = rsAuthResult.roles[0] || 'EMPLOYEE';

    // ── Step C: Save/update user in your own Prisma DB ──
    const HR_ADMIN_EMAILS = ['sushil.bishowkarma@rumsan.net'];
    const isHardcodedAdmin = HR_ADMIN_EMAILS.includes(email.toLowerCase());
    let assignedRole: Role;
    if (isHardcodedAdmin) {
      assignedRole = 'HRADMIN';
    } else {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      assignedRole = existingUser ? existingUser.role : (role as Role);
    }
    // Upsert: Create user if new, Update if exists
    const user = await this.prisma.user.upsert({
      where: { email },
      update: { name, avatar, role: assignedRole },
      create: {
        googleId: rsAuthResult.google.sub,
        email,
        name,
        avatar,
        role: assignedRole,
      },
    });

    // Seed leave balances for new users
    const policies = await this.prisma.leavePolicy.findMany({
      where: { isActive: true },
    });
    if (policies.length > 0) {
      await this.prisma.leaveBalance.createMany({
        data: policies.map((p) => ({
          employeeId: user.id,
          leaveType: p.leaveType,
          total: p.defaultQuota,
          remaining: p.defaultQuota,
        })),
        skipDuplicates: true,
      });
    }
    // ── Step D: Return RsOffice JWT + your Prisma user ──
    return {
      user,
      access_token: rsAuthResult.token, // ← RsOffice JWT (ES256K signed)
    };
  }
}

//////////////////////////////////////

//This  code only accept the user with @rumsan.net email address to login. It also has a hardcoded list of HR Admin emails. When a user logs in, it checks if their email is in the HR Admin list to assign them the HRADMIN role. For all other users, it checks if they already exist in the database to keep their current role or assigns them EMPLOYEE if they are new.

// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { PrismaService } from '../prisma/prisma.service';
// import { OAuth2Client } from 'google-auth-library';
// import { Role } from '@prisma/client';

// @Injectable()
// export class AuthService {
//   private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//   constructor(
//     private prisma: PrismaService,
//     private jwtService: JwtService,
//   ) {}

//   async validateGoogleUser(token: string) {
//     try {
//       const ticket = await this.googleClient.verifyIdToken({
//         idToken: token,
//         audience: process.env.GOOGLE_CLIENT_ID,
//       });

//       const payload = ticket.getPayload();
//       if (!payload || !payload.email) {
//         throw new UnauthorizedException(
//           'Google account must have an email address',
//         );
//       }

//       const { sub: googleId, email, name, picture: avatar } = payload;

//       // ── Domain restriction ────────────────────────────────────────────────
//       // Only @rumsan.net email addresses are allowed to register or login.
//       // Any other domain (gmail.com, yahoo.com, etc.) is rejected immediately.
//       if (!email.toLowerCase().endsWith('@rumsan.net')) {
//         throw new UnauthorizedException(
//           'Only @rumsan.net email addresses are authorized to access this system.',
//         );
//       }
//       // ─────────────────────────────────────────────────────────────────────

//       const HR_ADMIN_EMAILS = [
//         'anusha.thapa@rumsan.net',
//         'sushil.bishowkarma@rumsan.net',
//       ];

//       // Check if this email is a hardcoded HR Admin
//       const isHardcodedAdmin = HR_ADMIN_EMAILS.includes(email.toLowerCase());

//       let assignedRole: Role;

//       if (isHardcodedAdmin) {
//         assignedRole = 'HRADMIN';
//       } else {
//         // Look for existing user in DB to keep their current role
//         const existingUser = await this.prisma.user.findUnique({
//           where: { googleId },
//         });

//         // If user exists keep their role. If brand new, assign 'EMPLOYEE'.
//         assignedRole = existingUser ? existingUser.role : 'EMPLOYEE';
//       }

//       // Upsert: Create user if new, Update if exists
//       const user = await this.prisma.user.upsert({
//         where: { googleId },
//         update: { name, avatar, role: assignedRole },
//         create: {
//           googleId,
//           email,
//           name,
//           avatar,
//           role: assignedRole,
//         },
//       });

//       // Generate our own JWT for the frontend to use
//       const jwtPayload = { sub: user.id, email: user.email, role: user.role };
//       return {
//         user,
//         access_token: await this.jwtService.signAsync(jwtPayload),
//       };
//     } catch (e) {
//       // Re-throw UnauthorizedException as-is so the message reaches the client.
//       // Wrap any other unexpected error (network, Google API, etc.) generically.
//       if (e instanceof UnauthorizedException) throw e;
//       throw new UnauthorizedException('Google authentication failed');
//     }
//   }
// }
