// import { Injectable } from '@nestjs/common';
// import { createSign, createVerify } from 'crypto';
// import * as jwt from 'jsonwebtoken';

// @Injectable()
// export class CryptoService {
//   private readonly privateKey: string;

//   constructor() {
//     const key = process.env.APP_PRIVATE_KEY;
//     if (!key) throw new Error('APP_PRIVATE_KEY env var is required');
//     this.privateKey = key;
//   }

//   signChallenge(challenge: string): string {
//     // Sign using secp256k1 — matches what RsOffice expects
//     const sign = createSign('SHA256');
//     sign.update(challenge);
//     sign.end();
//     return '0x' + sign.sign(this.privateKey, 'hex');
//   }

//   async verifyJwt(
//     token: string,
//     publicKey: string,
//   ): Promise<{ valid: boolean; payload: any }> {
//     try {
//       const payload = jwt.verify(token, publicKey, { algorithms: ['ES256K'] });
//       return { valid: true, payload };
//     } catch {
//       return { valid: false, payload: null };
//     }
//   }
// }

import { Injectable } from '@nestjs/common';
import { signChallenge, verifyJwt } from '@rumsan/user';
import type { JwtPayload } from '@rumsan/user';

/**
 * Thin NestJS wrapper around the @rumsan/user secp256k1 crypto utilities.
 *
 * Holds the app's private key from APP_PRIVATE_KEY env and delegates all
 * cryptographic work to the pure-JS SDK functions — no native bindings.
 */
@Injectable()
export class CryptoService {
  private readonly privateKeyHex: string;

  constructor() {
    const privateKeyHex = process.env.APP_PRIVATE_KEY;
    if (!privateKeyHex) throw new Error('APP_PRIVATE_KEY env var is required');
    this.privateKeyHex = privateKeyHex;
  }

  signChallenge(challenge: string): string {
    return signChallenge(challenge, this.privateKeyHex);
  }

  verifyJwt(
    token: string,
    publicKeyHex: string,
  ): Promise<{ valid: boolean; payload?: JwtPayload }> {
    return verifyJwt(token, publicKeyHex);
  }

  private hexToBytes(hex: string): Uint8Array {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
    }
    return bytes;
  }
}
