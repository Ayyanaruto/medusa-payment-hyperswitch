import type {
  OrderService,
  SubscriberConfig,
  SubscriberArgs,
} from '@medusajs/medusa';
import Logger from '../utils/logger';
import { MedusaError, MedusaErrorTypes } from '@medusajs/utils';
import { CredentialsRepository } from "../repositories/credentials";
import { CredentialsType } from 'src/types';

type OrderPlacedData = {
  id: string;
};

function isOrderPlacedData(data: unknown): data is OrderPlacedData {
  return typeof data === 'object' && data !== null && 'id' in data;
}

export const config: SubscriberConfig = {
  event: 'order.placed',
};

export default async function orderCapturer({
  container,
  data,
}: SubscriberArgs) {
  const orderService = container.resolve<OrderService>('orderService');
  const credentialsRepository = container.resolve<typeof CredentialsRepository>(
    'credentialsRepository',
  );
  const logger = new Logger()

  try {
    const pluginConfiguration = await credentialsRepository.extract() as CredentialsType;
    logger.debug("Capturing order",pluginConfiguration,"ORDER_CAPTURE")
    
    if(pluginConfiguration.capture_method === "automatic"){
  
    if (!isOrderPlacedData(data)) {
      return;
    }

    const order = await orderService.retrieve(data.id, {
      relations: ['payments'],
    });
    if (!order) return;


    const isPaidForWitHyperswitch = order.payments?.some(
      p => p.provider_id === 'hyperswitch',
    );
    if (!isPaidForWitHyperswitch) return;

   

    await orderService.capturePayment(order.id);}
    else{
     logger.debug("Capture method is set to manual, skipping automatic capture",pluginConfiguration.capture_method,"ORDER_CAPTURE")
      return;
    }

  } catch (error) {
    logger.error(error, "ORDER_CAPTURE")
    throw new MedusaError(
      MedusaErrorTypes.INVALID_DATA,
      `Error capturing order: ${error.message}`,
    );
  }
}
