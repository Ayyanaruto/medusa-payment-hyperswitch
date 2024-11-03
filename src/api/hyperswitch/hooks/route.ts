import { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import HyperswitchWebhookService from '../../../services/hyperswitch-webhook-processor';
import { MedusaError } from '@medusajs/utils';
import Logger from '../../../utils/logger';

const logger = new Logger();

type RequestBody = {
  event_type?: string;
  status?: string;
  payment_id?: string;
  metadata?: {
    cart_id: string;
  };
object: {
  payment_id: string;
  metadata: {
    cart_id: string;
  };
};
};

const validateRequestBody = (body:any) => {
  console.log('body', body);
  const { event_type, status, payment_id, metadata } = body;
  if (!event_type && !status) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Missing event_type and status in request body'
    );
  }
  if (!payment_id || !metadata) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Missing required fields in request body'
    );
  }
  if (!event_type) {
    body.event_type = `payment_${status}`;
  }
};

const logRequest = (req: MedusaRequest, res: MedusaResponse, level: string, message: string, additionalInfo: object) => {
  logger.logApi(level, message, {
    requestType: req.method,
    requestBody: req.body,
    requestHeaders: req.headers,
    endpoint: req.path,
    browser: req.headers['user-agent']?.split(' ')[0] || 'Unknown',
    statusCode: res.statusCode,
    ...additionalInfo,
  }, 'HYPERSWITCH WEBHOOK');
};

const handleEvent = async (event_type: string, webhookData: { id: string, cart_id: string }, customPaymentService: HyperswitchWebhookService) => {
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
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log('req.body', req.body);
  const start = new Date().getTime();
  const customPaymentService = req.scope.resolve<HyperswitchWebhookService>('hyperswitchWebhookProcessorService');

  const { status, event_type: initialEventType, content } = req.body as any
  let { payment_id, metadata } = req.body as RequestBody;
  if (!payment_id || !metadata) {
    payment_id = content?.object?.payment_id;
    metadata = content?.object?.metadata;
  }


  const event_type = initialEventType || `payment_${status}`;

  try {
    validateRequestBody({ event_type, payment_id, metadata });

    const webhookData = {
      id: payment_id,
      cart_id: metadata.cart_id,
    };

    await handleEvent(event_type, webhookData, customPaymentService);

    const end = new Date().getTime();
    logRequest(req, res, 'DEBUG', 'Webhook processed successfully', {
      responseTime: end - start,
      responseBody: { received: true },
    });

    res.json({ received: true });
  } catch (error) {
    logRequest(req, res, 'ERROR', `Error processing webhook: ${error.message}`, {});
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Error processing webhook: ${error.message}`
    );
  }
};
