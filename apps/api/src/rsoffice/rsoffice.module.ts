import { Global, Module } from '@nestjs/common';
import { RsOfficeClient } from '@rumsan/user';

export const RS_OFFICE_CLIENT = Symbol('RS_OFFICE_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: RS_OFFICE_CLIENT,
      useFactory: (): RsOfficeClient => {
        const baseUrl = process.env.RS_USER_URL;
        if (!baseUrl) throw new Error('RS_USER_URL env var is required');
        return new RsOfficeClient({ baseUrl });
      },
    },
  ],
  exports: [RS_OFFICE_CLIENT],
})
export class RsOfficeModule {}
