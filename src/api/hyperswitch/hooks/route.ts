import { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import HyperswitchWebhookService from '../../../services/hyperswitch-webhook-processor';
import { MedusaError } from '@medusajs/utils';

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    const customPaymentService = req.scope.resolve<HyperswitchWebhookService>(
        'hyperswitchWebhookProcessorService'
    );
type RequestBody = {
    status: string;
    payment_id: string;
    metadata: {
        cart_id: string;
    };
};


const { status, payment_id, metadata } = req.body as RequestBody;
console.log(req.body);

    const event_type = 'payment_' + "succeeded";
    const webhookData = {
      id: payment_id,
      cart_id: metadata?.cart_id,
    };
   console.log(event_type);
    try {
        switch (event_type) {
          case 'payment_succeeded':
            await customPaymentService.handlePaymentSucceeded(webhookData);
            break;
            case 'payment_processing':
            await customPaymentService.handlePaymentProcessing(webhookData);
            break;
          case 'payment_authorized':
          case 'payment_captured':
            await customPaymentService.handlePaymentAuthorized(webhookData);
            break;
          case 'payment_failed':
            await customPaymentService.handlePaymentFailed(webhookData);
            break;

          case 'refund_processed':
            await customPaymentService.handleRefundProcessed(webhookData);
            break;

          default:
           throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Unsupported event type: ${event_type}`
            );
           
        }

        res.json({ received: true });
    } catch (error) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Error processing webhook: ${error.message}`
        );
    }
};
