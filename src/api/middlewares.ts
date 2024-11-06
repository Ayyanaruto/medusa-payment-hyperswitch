import { MiddlewaresConfig } from '@medusajs/medusa';
import { MedusaRequest, MedusaResponse, MedusaNextFunction } from '@medusajs/medusa';
import { raw } from 'body-parser';
import validateWebhook from '../utils/webhookValidator';


export const config: MiddlewaresConfig = {
  routes: [
    {
      matcher: '/hyperswitch/*',
      middlewares: [validateWebhook],
    },
  ],
};
