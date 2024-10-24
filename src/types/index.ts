export interface CredentialsType {
  publishable_key: string;
  secret_key: string;
  payment_hash_key: string;
  webhook_url: string;
  environment?: string;
  capture_method?: string;
  enable_save_cards?: boolean;
  appearence?: string;
}

export interface FormErrors {
  publishable_key?: string;
  secret_key?: string;
  payment_hash_key?: string;
  webhook_url?: string;
  environment?: string;
  capture_method?: string;
  appearence?: string;
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


