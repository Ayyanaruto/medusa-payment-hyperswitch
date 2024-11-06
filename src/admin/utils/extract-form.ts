import { CredentialsType, ProxyTypes } from '../../types';

export const extractFormData = (form: HTMLFormElement): CredentialsType => {
  const data = new FormData(form);
  return mapFormDataToCredentials(data);
};

export const extractProxyFormData = (form: HTMLFormElement): ProxyTypes => {
  const data = new FormData(form);
  console.log("Inside extractProxyFormData",data);
  return mapFormDataToProxy(data);
};

const mapFormDataToCredentials = (data: FormData): CredentialsType => {
  return {
    publishable_key: getString(data, 'publishable-key'),
    secret_key: getString(data, 'api-secret-key'),
    payment_hash_key: getString(data, 'payment-response-hash-key'),
    environment: getString(data, 'environment'),
    capture_method: getString(data, 'capture-method'),
    enable_save_cards: getBoolean(data, 'enable-save-cards'),
  };
};

const mapFormDataToProxy = (data: FormData): ProxyTypes => {
  return {
    enabled: getBoolean(data, 'enabled'),
    host: getString(data, 'host'),
    port: getNumber(data, 'port'),
    username: getString(data, 'username'),
    password: getString(data, 'password'),
    url: getString(data, 'url'),
  };
};

const getString = (data: FormData, key: string): string => {
  return data.get(key) as string || '';
};

const getBoolean = (data: FormData, key: string): boolean => {
  console.log(data);
  return data.get(key) === 'on';
};

const getNumber = (data: FormData, key: string): number => {
  const value = data.get(key);
  return value ? parseInt(value as string, 10) : 0;
};
