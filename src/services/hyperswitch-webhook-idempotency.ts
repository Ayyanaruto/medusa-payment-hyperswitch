import { EntityManager } from 'typeorm';
import { IdempotencyKeyService } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';

interface IdempotencyEvent {
    event_type: string;
    entity_id: string;
    metadata?: Record<string, unknown>;
}

export class WebhookIdempotencyService {
    private readonly manager: EntityManager;
    private readonly idempotencyKeyService: IdempotencyKeyService;

    constructor(container: {
        manager: EntityManager;
        idempotencyKeyService: IdempotencyKeyService;
    }) {
        this.manager = container.manager;
        this.idempotencyKeyService = container.idempotencyKeyService;
    }

    /**
     * Generate a unique idempotency key for a webhook event
     */
    private generateIdempotencyKey(event: IdempotencyEvent): string {
        return `webhook_${event.event_type}_${event.entity_id}`;
    }

    /**
     * Process a webhook event with idempotency check
     */
    async processWebhookWithIdempotency<T>(
        event: IdempotencyEvent,
        processor: () => Promise<T>,
    ): Promise<T | undefined> {
        const idempotencyKey = this.generateIdempotencyKey(event);
        console.info(`Processing webhook event ${event.event_type} for entity ${event.entity_id}`,idempotencyKey);
        if (await this.isEventAlreadyProcessed(idempotencyKey, event)) {
            console.info(`Event ${event.event_type} for entity ${event.entity_id} already processed, skipping`);
            return undefined;
        }

        return this.processEvent(idempotencyKey, event, processor);
    }

    /**
     * Check if an event was already processed
     */
    async wasEventProcessed(event: IdempotencyEvent): Promise<boolean> {
        const idempotencyKey = this.generateIdempotencyKey(event);
        return this.isEventAlreadyProcessed(idempotencyKey, event);
    }

    /**
     * Get the processing status of an event
     */
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
            return { processed: false };
        }
    }

    private async isEventAlreadyProcessed(idempotencyKey: string, event: IdempotencyEvent): Promise<boolean> {
        try {
            const existingKey = await this.idempotencyKeyService.retrieve(idempotencyKey);
            if (existingKey) {
                console.log(`Event ${event.event_type} for entity ${event.entity_id} already processed, skipping`);
                return true;
            }
        } catch {
            // Key not found, proceed with processing
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
                request_path: "/hyperswitch/hooks",
                request_method: 'POST',
                request_params: event.metadata || {},
            });

            return result;
        } catch (error) {
            await this.idempotencyKeyService.create({
                idempotency_key: idempotencyKey,
                request_path: "/hyperswitch/hooks",
                request_method: 'POST',
                request_params: error.metadata || {},
            });

            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Failed to process webhook event ${event.event_type}: ${error.message}`,
            );
        }
    }
}

export default WebhookIdempotencyService;