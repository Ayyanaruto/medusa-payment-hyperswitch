import { EntityManager } from 'typeorm';
import { IdempotencyKeyService } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';
import Logger from '../utils/logger';

interface IdempotencyEvent {
  event_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
}

export class WebhookIdempotencyService {
  private readonly manager: EntityManager;
  private readonly idempotencyKeyService: IdempotencyKeyService;
  private readonly logger: Logger;

  constructor(container: {
    manager: EntityManager;
    idempotencyKeyService: IdempotencyKeyService;
  }) {
    this.manager = container.manager;
    this.idempotencyKeyService = container.idempotencyKeyService;
    this.logger = new Logger();
  }

  private generateIdempotencyKey(event: IdempotencyEvent): string {
    return `webhook_${event.event_type}_${event.entity_id}`;
  }

  async processWebhookWithIdempotency<T>(
    event: IdempotencyEvent,
    processor: () => Promise<T>,
  ): Promise<T | undefined> {
    const idempotencyKey = this.generateIdempotencyKey(event);
    this.logger.debug(
      `Processing webhook event ${event.event_type} for entity ${event.entity_id}`,
      idempotencyKey,
    );
    if (await this.isEventAlreadyProcessed(idempotencyKey, event)) {
      this.logger.debug(
        `Event ${event.event_type} for entity ${event.entity_id} already processed, skipping`,
        idempotencyKey,
        'WEBHOOK IDEMPOTENCY SERVICE',
      );
      return undefined;
    }

    return this.processEvent(idempotencyKey, event, processor);
  }

  async wasEventProcessed(event: IdempotencyEvent): Promise<boolean> {
    const idempotencyKey = this.generateIdempotencyKey(event);
    return this.isEventAlreadyProcessed(idempotencyKey, event);
  }

  async getEventProcessingStatus(event: IdempotencyEvent): Promise<{
    processed: boolean;
    error?: {
      code: string;
      message: string;
    };
  }> {
    const idempotencyKey = this.generateIdempotencyKey(event);
    try {
      const key = await this.idempotencyKeyService.retrieve(idempotencyKey);
      if (!key) {
        return { processed: false };
      }

      return {
        processed: true,
        error: (key as any).error_code
          ? {
              code: (key as any).error_code,
              message: (key as any).error_message || 'Unknown error',
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve idempotency key for event ${event.event_type}: ${error.message}`,
        error,
        'WEBHOOK IDEMPOTENCY SERVICE',
      );
      return { processed: false };
    }
  }

  private async isEventAlreadyProcessed(
    idempotencyKey: string,
    event: IdempotencyEvent,
  ): Promise<boolean> {
    try {
      const existingKey = await this.idempotencyKeyService.retrieve(
        idempotencyKey,
      );
      if (existingKey) {
        this.logger.debug(
          `Event ${event.event_type} for entity ${event.entity_id} already processed, skipping`,
          idempotencyKey,
          'WEBHOOK IDEMPOTENCY SERVICE',
        );
        return true;
      }
    } catch (error) {
      this.logger.error(
        `Error checking if event ${event.event_type} for entity ${event.entity_id} is already processed: ${error.message}, skipping`,
        error,
        'WEBHOOK IDEMPOTENCY SERVICE',
      );
    }
    return false;
  }

  private async processEvent<T>(
    idempotencyKey: string,
    event: IdempotencyEvent,
    processor: () => Promise<T>,
  ): Promise<T | undefined> {
    try {
      const result = await processor();

      await this.idempotencyKeyService.create({
        idempotency_key: idempotencyKey,
        request_path: '/hyperswitch/hooks',
        request_method: 'POST',
        request_params: event.metadata || {},
      });

      this.logger.debug(
        `Successfully processed event ${event.event_type} for entity ${event.entity_id}`,
        idempotencyKey,
        'WEBHOOK IDEMPOTENCY SERVICE',
      );
      return result;
    } catch (error) {
      await this.idempotencyKeyService.create({
        idempotency_key: idempotencyKey,
        request_path: '/hyperswitch/hooks',
        request_method: 'POST',
        request_params: error.metadata || {},
      });

      this.logger.error(
        `Failed to process webhook event ${event.event_type}: ${error.message}`,
        error,
        'WEBHOOK IDEMPOTENCY SERVICE',
      );
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to process webhook event ${event.event_type}: ${error.message}`,
      );
    }
  }
}

export default WebhookIdempotencyService;
