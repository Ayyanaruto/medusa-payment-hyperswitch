import ConfigurationsService from "../../modules/configurations/service";
import ProxyService from "../../modules/proxy/service";
import CustomizationService from "../../modules/customization/service";

export type InjectedDependencies = {
  configurationsService: ConfigurationsService;
  proxyService: ProxyService;
  customizationService: CustomizationService;
};

export enum ProcessorStatus {
 SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PROCESSING = 'processing',
  REQUIRES_CUSTOMER_ACTION = 'requires_customer_action',
  REQUIRES_MERCHANT_ACTION = 'requires_merchant_action',
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_CAPTURE = 'requires_capture',
}

