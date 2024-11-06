
import {
  PaymentProcessorSessionResponse,
  OrderService,
  EventBusService,
  PaymentProcessor,
  CartService,
  IdempotencyKeyService,
} from '@medusajs/medusa';
import { EntityManager } from 'typeorm';
import { PaymentRepository } from '@medusajs/medusa/dist/repositories/payment';
import { RefundRepository } from '@medusajs/medusa/dist/repositories/refund';
import { WebhookIdempotencyService } from '../services/hyperswitch-webhook-idempotency';
import CredentialsService from '../services/credentials';
import ProxyService from '../services/proxy';
import CustomisationService from '../services/customisation';
export interface CredentialsType {
  publishable_key: string;
  secret_key: string;
  payment_hash_key: string;
  environment?: string;
  capture_method?: string;
  enable_save_cards?: boolean;
  appearance?: string;
}
export interface BillingAddress {
  city: string;
  country_code: string;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  postal_code: string;
  province?: string;
  phone?: string;
}

export interface Customer {
  id: string;
  email: string;
}

export interface FormErrors {
  publishable_key?: string;
  secret_key?: string;
  payment_hash_key?: string;
  environment?: string;
  capture_method?: string;
  appearance?: string;
}
export interface ProxyFormErrors{
  enabled?: string;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  url?: string;
}
export interface CustomError {
  theme?: 'light' | 'dark' | 'midnight' | 'solarized' | 'outline';
  appearance?: string;
}
export interface FormSetters {
  setPublishableKey: (value: string) => void;
  setSecretKey: (value: string) => void;
  setPaymentHashKey: (value: string) => void;
  setWebhookURL: (value: string) => void;
  setEnvironment: (value: string) => void;
  setCaptureMethod: (value: string) => void;
  setEnableSaveCards: (value: boolean) => void;
  setAppearence: (value: string) => void;
}
export interface ResponseQuery {
  credentials?: CredentialsType;
}

export interface HyperswitchIconProps {
  width?: string;
  height?: string;
}
//---------------------------------------------- Customisation Types ----------------------------------------------//
export interface CustomisationTypes {
  appearance: string;
  theme: string;
}
//---------------------------------------------- Transaction Types ----------------------------------------------//
export type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

export interface HyperSwitchResponse<T> {
  status: number;
  data: T;
}

export enum TransactionStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PROCESSING = 'processing',
  REQUIRES_CUSTOMER_ACTION = 'requires_customer_action',
  REQUIRES_MERCHANT_ACTION = 'requires_merchant_action',
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_CAPTURE = 'requires_capture',
  PARTIALLY_CAPTURED = 'partially_captured',
  PARTIALLY_CAPTURED_AND_CAPTURABLE = 'partially_captured_and_capturable',
}

export interface RequestOptions {
  path: string;
  method: HTTPMethod;
  headers?: Record<string, string>;
  body?:
    | Record<string, unknown>
    | TransactionCreateParams
    | TransactionUpdateParams;
  query?: Record<string, unknown>;
}

export interface TransactionCreateParams{
  amount: number;
  currency: string;
  payment_experience?: string;
  capture_method?: string;
  confirm?: boolean;
  setup_future_usage: string;
  billing?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  theme?: string;
  appearance?: string;
}

export interface TransactionUpdateParams {
  payment_id: string;
  payment_experience?: string;
  confirm?: boolean;
  amount: number;
  billing?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  return_url?: string;
  customer_id?: string;
  capture_method?: string;
}

export interface TransactionFetchParams {
  payment_id: string;
  amount_to_capture?: number;
}

export interface TransactionResponse extends PaymentProcessorSessionResponse {
  cart_id: string;
  payment_id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  capture_method: string;
  setup_future_usage: string;
  billing?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  expires_at: string;
  confirmed_at: string;
  captured_at: string;
  refunded_at: string;
  voided_at: string;
  error?: Record<string, unknown>;
  browser_info?: string;
  payment_method?: string;
  connector?: string;
  appearance?: string;
  theme?: string;
}
//---------------------------------------------- Webhook Types ----------------------------------------------//
export type InjectedDependencies = {
  manager: EntityManager;
  paymentRepository: typeof PaymentRepository;
  refundRepository: typeof RefundRepository;
  eventBusService: EventBusService;
  orderService: OrderService;
  paymentService: PaymentProcessor;
  cartService: CartService;
  idempotencyKeyService: IdempotencyKeyService;
  hyperswitchWebhookIdempotencyService: WebhookIdempotencyService;
};

export interface WebhookData {
  id: string;
  metadata?: Record<string, unknown>;
  cart_id?: string;
  payment_intent?: {
    id: string;
    metadata?: Record<string, unknown>;
  };
}
//---------------------------------------------- Processor Types ----------------------------------------------//
export interface HyperswitchPaymentProcessorDependencies {
  credentialsService: CredentialsService;
  proxyService: ProxyService;
  cartService: CartService;
  customisationService: CustomisationService;
}

export interface PaymentProcessorError {
  error: string;
  code?: string;
  detail?: any;
}
//---------------------------------------------- Idempotency Types ----------------------------------------------//
export interface IdempotencyEvent {
  event_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
}
//---------------------------------------------- Proxy Types ----------------------------------------------//
export interface ProxyTypes {
  url?: string;
  username?: string;
  password?: string;
  host: string;
  port: number;
  enabled?: boolean;

}