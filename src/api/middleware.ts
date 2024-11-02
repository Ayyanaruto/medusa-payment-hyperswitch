import { MiddlewaresConfig } from '@medusajs/medusa';
import { raw } from 'body-parser';
export const config: MiddlewaresConfig = {
  routes: [
    {
      matcher: '/hyperswitch/*',
      bodyParser: false,
      middlewares: [raw({ type: 'application/json' })],
    },
  ],
};
