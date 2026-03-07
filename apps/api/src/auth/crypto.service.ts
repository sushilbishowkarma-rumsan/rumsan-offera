import { Injectable } from '@nestjs/common';
import { signChallenge, verifyJwt } from '@rumsan/user';
import type { JwtPayload } from '@rumsan/user';

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
