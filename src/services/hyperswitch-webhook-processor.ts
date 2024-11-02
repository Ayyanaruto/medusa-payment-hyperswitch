import {
  TransactionBaseService,
  PaymentSessionStatus,
  OrderService,
  EventBusService,
  PaymentProcessor,
  CartService,
  IdempotencyKeyService,
} from '@medusajs/medusa';
import { EntityManager } from 'typeorm';
import { PaymentRepository } from '@medusajs/medusa/dist/repositories/payment';
import { RefundRepository } from '@medusajs/medusa/dist/repositories/refund';
import {
  WebhookIdempotencyService,
} from './hyperswitch-webhook-idempotency';
import { MedusaError } from '@medusajs/utils';

type InjectedDependencies = {
  manager: EntityManager;
  paymentRepository: typeof PaymentRepository;
  refundRepository: typeof RefundRepository;
  eventBusService: EventBusService;
  orderService: OrderService;
  paymentService: PaymentProcessor;
  cartService: CartService;
  idempotencyKeyService: IdempotencyKeyService;
  webhookIdempotencyService: WebhookIdempotencyService;
};

interface WebhookData {
  id: string;
  metadata?: Record<string, unknown>;
  cart_id?: string;
  payment_intent?: {
    id: string;
    metadata?: Record<string, unknown>;
  };
}

class HyperswitchWebhook extends TransactionBaseService {
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager | undefined;
  protected paymentRepository_: typeof PaymentRepository;
  protected refundRepository_: typeof RefundRepository;
  protected eventBus_: EventBusService;
  protected orderService_: OrderService;
  protected paymentService_: PaymentProcessor;
  protected cartService_: CartService;
  protected idempotencyKeyService_: IdempotencyKeyService;
  protected webhookIdempotencyService_: WebhookIdempotencyService;

  constructor(container: any) {
    super(container);
    this.manager_ = container.manager;
    this.paymentRepository_ = container.paymentRepository;
    this.refundRepository_ = container.refundRepository;
    this.eventBus_ = container.eventBusService;
    this.orderService_ = container.orderService;
    this.paymentService_ = container.paymentService;
    this.cartService_ = container.cartService;
    this.idempotencyKeyService_ = container.idempotencyKeyService;
    this.webhookIdempotencyService_ =
      container.hyperswitchWebhookIdempotencyService;
  
  }

  private createWebhookEvent(
    type: string,
    data: WebhookData,
  ): { event_type: string; entity_id: string; metadata: Record<string, unknown> } {
    return {
      event_type: type,
      entity_id: data.id,
      metadata: {
        ...data.metadata,
        cart_id: data.cart_id,
        payment_intent_id: data.payment_intent?.id,
      },
    };
  }

  private async findPaymentByCartId(cartId: string): Promise<any> {
    console.log(`Finding payment by cart ID: ${cartId}`);
    try {
      return await this.paymentRepository_.findOne({
        where: { cart_id: cartId },
        relations: ['cart'],
      });
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Error finding payment by cart ID: ${error.message}`,
      );
    }
  }

  private async findPaymentByProviderId(providerId: string): Promise<any> {
    console.log(`Finding payment by provider ID: ${providerId}`);
    try {
      return await this.paymentRepository_.findOne({
        where: { provider_id: providerId },
        relations: ['cart'],
      });
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Error finding payment by provider ID: ${error.message}`,
      );
    }
  }

  private extractCartId(data: WebhookData): string | undefined {
    return (
      data.cart_id ||
      (data.metadata?.cart_id as string) ||
      (data.payment_intent?.metadata?.cart_id as string)
    );
  }

  private async findPaymentFromWebhook(data: WebhookData): Promise<any> {
    const cartId = this.extractCartId(data);
    let payment;

    if (cartId) {
      payment = await this.findPaymentByCartId(cartId);
      if (payment && payment.provider_id !== 'hyperswitch') {
        return payment;
      }
    }

    payment = await this.findPaymentByProviderId(data.id);
    if (payment) {
      return payment;
    }

    if (cartId) {
      try {
        const cart = await this.cartService_.retrieve(cartId, {
          relations: ['payment'],
        });
        if (cart?.payment) {
          return cart.payment;
        }
      } catch (error) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Error retrieving cart: ${error.message}`,
        );
      }
    }

    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment not found for webhook data: ${JSON.stringify(data)}`,
    );
  }

  async handlePaymentAuthorized(data: WebhookData): Promise<void> {
    const event = this.createWebhookEvent('payment_authorized', data);

    await this.webhookIdempotencyService_.processWebhookWithIdempotency(
      event,
      async () => {
        return await this.atomicPhase_(async manager => {
          const payment = await this.findPaymentFromWebhook(data);

          if (payment.status === PaymentSessionStatus.AUTHORIZED) {
            return;
          }

          payment.status = PaymentSessionStatus.AUTHORIZED;
          payment.data = { ...payment.data, ...data, provider_id: data.id };
          await this.paymentRepository_.save(payment);

          await this.eventBus_.emit('custom-payment.payment_authorized', {
            id: payment.id,
            cart_id: payment.cart_id,
            payment_id: data.id,
            ...data,
          });

          if (payment.cart_id) {
            try {
              await this.cartService_.authorizePayment(payment.cart_id);
            } catch (error) {
              payment.status = PaymentSessionStatus.ERROR;
              await this.paymentRepository_.save(payment);
              throw error;
            }
          }
        });
      },
    );
  }

  async handlePaymentSucceeded(data: WebhookData): Promise<void> {
    const event = this.createWebhookEvent('payment_succeeded', data);

    await this.webhookIdempotencyService_.processWebhookWithIdempotency(
      event,
      async () => {
        return await this.atomicPhase_(async manager => {
          const payment = await this.findPaymentFromWebhook(data);

          if (payment.status === PaymentSessionStatus.AUTHORIZED) {
            return;
          }

          payment.status = PaymentSessionStatus.AUTHORIZED;
          payment.data = { ...payment.data, ...data, provider_id: data.id };
          await this.paymentRepository_.save(payment);

          await this.eventBus_.emit('custom-payment.payment_succeeded', {
            id: payment.id,
            cart_id: payment.cart_id,
            payment_id: data.id,
            ...data,
          });

          if (payment.cart_id) {
            const order = await this.orderService_.retrieveByCartId(
              payment.cart_id,
            );
            if (order) {
              await this.orderService_.capturePayment(order.id);
            }
          }
        });
      },
    );
  }

  async handlePaymentFailed(data: WebhookData): Promise<void> {
    const event = this.createWebhookEvent('payment_failed', data);

    await this.webhookIdempotencyService_.processWebhookWithIdempotency(
      event,
      async () => {
        return await this.atomicPhase_(async manager => {
          const payment = await this.findPaymentFromWebhook(data);

          payment.status = PaymentSessionStatus.ERROR;
          payment.data = { ...payment.data, ...data, provider_id: data.id };
          await this.paymentRepository_.save(payment);

          await this.eventBus_.emit('custom-payment.payment_failed', {
            id: payment.id,
            cart_id: payment.cart_id,
            payment_id: data.id,
            error: data.metadata?.error,
            ...data,
          });
        });
      },
    );
  }

  async handlePaymentProcessing(data: WebhookData): Promise<void> {
    const event = this.createWebhookEvent('payment_processing', data);

    await this.webhookIdempotencyService_.processWebhookWithIdempotency(
      event,
      async () => {
        return await this.atomicPhase_(async manager => {
          const payment = await this.findPaymentFromWebhook(data);

          if (
            [
              PaymentSessionStatus.AUTHORIZED,
              PaymentSessionStatus.ERROR,
            ].includes(payment.status)
          ) {
            return;
          }

          payment.status = PaymentSessionStatus.PENDING;
          payment.data = {
            ...payment.data,
            ...data,
            provider_id: data.id,
            processing_started_at: new Date().toISOString(),
          };
          await this.paymentRepository_.save(payment);

          await this.eventBus_.emit('custom-payment.payment_processing', {
            id: payment.id,
            cart_id: payment.cart_id,
            payment_id: data.id,
            ...data,
          });

          if (payment.cart_id) {
            const cart = await this.cartService_.retrieve(payment.cart_id);
            if (cart.payment_session) {
              cart.payment_session.status = PaymentSessionStatus.PENDING;
              await this.cartService_.updatePaymentSession(cart.id, {
                payment_session: cart.payment_session,
              });
            }
          }

          const timeoutDuration = this.getProcessingTimeoutDuration();
          if (timeoutDuration) {
            this.setupProcessingTimeout(data, timeoutDuration);
          }
        });
      },
    );
  }

  private setupProcessingTimeout(
    data: WebhookData,
    timeoutDuration: number,
  ): void {
    setTimeout(async () => {
      try {
        const payment = await this.findPaymentByProviderId(data.id);
        if (payment?.status === PaymentSessionStatus.PENDING) {
          await this.handlePaymentFailed({
            ...data,
            metadata: {
              ...data.metadata,
              error: 'Payment processing timeout exceeded',
            },
          });
        }
      } catch (error) {
        console.error(`Error handling payment timeout: ${error.message}`);
      }
    }, timeoutDuration);
  }

  private getProcessingTimeoutDuration(): number | null {
    const timeoutMinutes = process.env.PAYMENT_PROCESSING_TIMEOUT_MINUTES || 30;
    const timeoutMinutesNumber = Number(timeoutMinutes);
    return !isNaN(timeoutMinutesNumber)
      ? timeoutMinutesNumber * 60 * 1000
      : null;
  }

  async handleRefundProcessed(data: WebhookData): Promise<void> {
    const event = this.createWebhookEvent('refund_processed', data);

    await this.webhookIdempotencyService_.processWebhookWithIdempotency(
      event,
      async () => {
        return await this.atomicPhase_(async manager => {
          const payment = await this.findPaymentFromWebhook(data);
          const refund = await this.refundRepository_.findOne({
            where: { payment_id: payment.id },
          });

          if (!refund) {
            throw new MedusaError(
              MedusaError.Types.NOT_FOUND,
              `Refund not found for payment ${payment.id}`,
            );
          }

          refund.idempotency_key = 'succeeded';
          refund.metadata = data.metadata || {};
          await this.refundRepository_.save(refund);

          await this.eventBus_.emit('custom-payment.refund_processed', {
            id: refund.id,
            cart_id: payment.cart_id,
            payment_id: payment.id,
            ...data,
          });
        });
      },
    );
  }
}

export default HyperswitchWebhook;
