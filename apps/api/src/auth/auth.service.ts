import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OAuth2Client } from 'google-auth-library';
import { Role } from '@prisma/client';
@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      // console.log('Google token verified successfully for token:', token); // Debug log

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException(
          'Google account must have an email address',
        );
      }
      const { sub: googleId, email, name, picture: avatar } = payload;

      const HR_ADMIN_EMAILS = [
        'anusha.thapa@rumsan.net',
        'sushil.bishowkarma@rumsan.net',
      ];

      const isHardcodedAdmin = HR_ADMIN_EMAILS.includes(email.toLowerCase());
      // 2. Check if the current user's email is in that list

      let assignedRole: Role;

      if (isHardcodedAdmin) {
        assignedRole = 'HRADMIN';
      } else {
        // 2. Look for existing user in DB to keep their current role
        const existingUser = await this.prisma.user.findUnique({
          where: { googleId },
        });

        // If user exists, keep their role. If brand new, assign 'EMPLOYEE'.
        assignedRole = existingUser ? existingUser.role : 'EMPLOYEE';
      }

      // Upsert: Create user if new, Update if exists
      const user = await this.prisma.user.upsert({
        where: { googleId },
        update: { name, avatar, role: assignedRole },
        create: {
          googleId,
          email,
          name,
          avatar,
          role: assignedRole,
        },
      });

      // Generate our own JWT for the frontend to use
      const jwtPayload = { sub: user.id, email: user.email, role: user.role };
      return {
        user,
        access_token: await this.jwtService.signAsync(jwtPayload),
      };
    } catch (e) {
      throw new UnauthorizedException('Google authentication failed');
    }
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
