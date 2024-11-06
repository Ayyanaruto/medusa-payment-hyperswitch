import { MedusaRequest, MedusaResponse, MedusaNextFunction } from '@medusajs/medusa';
import HyperswitchWebhookService from '../../../services/hyperswitch-webhook-processor';
import { MedusaError } from '@medusajs/utils';
import Logger from '../../../utils/logger';
import CredentialsService from '../../../services/credentials';
import { CredentialsType } from '../../../types';



const logger = new Logger();

interface Metadata {
  cart_id: string;
}

interface RequestBody {
  event_type?: string;
  status?: string;
  payment_id?: string;
  metadata?: Metadata;
  content?: {
    object: {
      payment_id: string;
      metadata: Metadata;
    };
  };
}

interface WebhookData {
  id: string;
  cart_id: string;
}

const validateRequestBody = (body: RequestBody): void => {
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

const logRequest = (
  req: MedusaRequest,
  res: MedusaResponse,
  level: string,
  message: string,
  additionalInfo: object
): void => {
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

const handleEvent = async (
  eventType: string,
  webhookData: WebhookData,
  customPaymentService: HyperswitchWebhookService
): Promise<void> => {
  switch (eventType) {
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
        `Unsupported event type: ${eventType}`
      );
  }
};

const extractPaymentDetails = (body: RequestBody): { payment_id: string; metadata: Metadata } => {
  const { payment_id, metadata, content } = body;
  if (payment_id && metadata) {
    return { payment_id, metadata };
  }
  if (content?.object?.payment_id && content?.object?.metadata) {
    return { payment_id: content.object.payment_id, metadata: content.object.metadata };
  }
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    'Missing payment_id and metadata in request body'
  );
};

export const POST = async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction): Promise<void> => {
  try {
    const credentialsService = req.scope.resolve<CredentialsService>('credentialsService');
    const credentials: CredentialsType = await credentialsService.extract() as CredentialsType;
    const paymentResponseHashKey = credentials.payment_hash_key;
    
    const start = Date.now();
    const customPaymentService = req.scope.resolve<HyperswitchWebhookService>('hyperswitchWebhookProcessorService');

    const { status, event_type: initialEventType } = req.body as RequestBody;
    const { payment_id, metadata } = extractPaymentDetails(req.body as RequestBody);

    const eventType = initialEventType || `payment_${status}`;

    validateRequestBody({ event_type: eventType, payment_id, metadata });

    const webhookData: WebhookData = {
      id: payment_id,
      cart_id: metadata.cart_id,
    };

    await new Promise(resolve => setTimeout(resolve, 2000));

    await handleEvent(eventType, webhookData, customPaymentService);

    const end = Date.now();
    logRequest(req, res, 'DEBUG', 'Webhook processed successfully', {
      responseTime: end - start,
      responseBody: { received: true },
    });

    res.json({ received: true });
  } catch (error) {
    logRequest(req, res, 'ERROR', `Error processing webhook: ${error.message}`, {});
    next(new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Error processing webhook: ${error.message}`
    ));
  }
};
