export interface SelectFieldProps {
  isEditing: boolean;
  value: string;
  onChange: (value: any) => void;
  error?: string;
}
export interface FormErrors {
  publishable_key?: string;
  secret_key?: string;
  payment_hash_key?: string;
  environment?: string;
  capture_method?: string;
  appearance?: string;
}

export interface FormContentProps {
  formState:ConfigurationTypes;
  handleChange: {
    publishableKey: (e: React.ChangeEvent<HTMLInputElement>) => void;
    secretKey: (e: React.ChangeEvent<HTMLInputElement>) => void;
    paymentHashKey: (e: React.ChangeEvent<HTMLInputElement>) => void;
    environment: (value:("sandbox"|"production")) => void;
    captureMethod: (value:("manual"|"automatic")) => void;
    enableSaveCards: (checked: boolean) => void;
  };
  isEditing: boolean;
  errors: {
    publishable_key?: string;
    secret_key?: string;
    payment_hash_key?: string;
    environment?: string;
    capture_method?: string;
  };
}

export interface ConfigurationTypes {
  publishableKey: string;
  secretKey: string;
  paymentHashKey: string;
  environment: ("sandbox" | "production");
  captureMethod: ("manual" | "automatic");
  enableSaveCards: boolean;
}