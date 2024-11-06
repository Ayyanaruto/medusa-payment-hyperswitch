import { useState } from 'react';
import { FormErrors, CustomError,ProxyFormErrors,ProxyTypes } from '../../types';

export const useHyperswitchForm = () => {
  const [publishableKey, setPublishableKey] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [paymentHashKey, setPaymentHashKey] = useState<string>('');
  const [proxyURL, setProxyURL] = useState<string>('');
  const [environment, setEnvironment] = useState<string>('sandbox');
  const [captureMethod, setCaptureMethod] = useState<string>('manual');
  const [enableSaveCards, setEnableSaveCards] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = {
    publishableKey: (event: React.ChangeEvent<HTMLInputElement>) =>
      setPublishableKey(event.target.value),
    secretKey: (event: React.ChangeEvent<HTMLInputElement>) =>
      setSecretKey(event.target.value),
    paymentHashKey: (event: React.ChangeEvent<HTMLInputElement>) =>
      setPaymentHashKey(event.target.value),
    proxyURL: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyURL(event.target.value),
    environment: (value: string) => setEnvironment(value),
    captureMethod: (value: string) => setCaptureMethod(value),
    enableSaveCards: (checked: boolean) => setEnableSaveCards(checked),
  };

  return {
    formState: {
      publishable_key: publishableKey,
      secret_key: secretKey,
      payment_hash_key: paymentHashKey,
      environment,
      capture_method: captureMethod,
      enable_save_cards: enableSaveCards,
    },
    formSetters: {
      setpublishable_key: setPublishableKey,
      setsecret_key: setSecretKey,
      setpayment_hash_key: setPaymentHashKey,
      setenvironment: setEnvironment,
      setcapture_method: setCaptureMethod,
      setenable_save_cards: setEnableSaveCards,
    },
    handleChange,
    isEditing,
    setIsEditing,
    errors,
    setErrors,
  };
};

export const useCustomization = () => {
  const [themes, setThemes] = useState<string>('light');
  const [appearance, setAppearance] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [errors, setErrors] = useState<CustomError>({});

  const handleChange = {
    themes: (value: string) => setThemes(value),
    appearance: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setAppearance(event.target.value),
  };

  return {
    formState: {
      themes,
      appearance,
    },
    formSetters: {
      setThemes,
      setAppearance,
    },
    handleChange,
    isEditing,
    setIsEditing,
    errors,
    setErrors,
  };
};

export const useProxyForm = () => {
  const [enableProxy, setEnableProxy] = useState<boolean>(false);
  const [proxyUrl, setProxyUrl] = useState<string>('');
  const [proxyHost, setProxyHost] = useState<string>('');
  const [proxyUsername, setProxyUsername] = useState<string>('');
  const [proxyPassword, setProxyPassword] = useState<string>('');
  const [proxyPort, setProxyPort] = useState<number>(0);
  const [errors, setErrors] = useState<ProxyFormErrors>({});
  const handleChange = {
    enableProxy: (checked: boolean) => setEnableProxy(checked),
    proxyHost: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyHost(event.target.value),
    proxyUrl: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyUrl(event.target.value),
    proxyUsername: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyUsername(event.target.value),
    proxyPassword: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyPassword(event.target.value),
    proxyPort: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyPort(Number(event.target.value)),
  };

  return {
    formState: {
      enabled: enableProxy,
      host: proxyHost,
      url: proxyUrl,
      username: proxyUsername,
      password: proxyPassword,
      port: proxyPort,
    } as ProxyTypes,
    formSetters: {
      setEnableProxy,
      setProxyHost,
      setProxyUrl,
      setProxyUsername,
      setProxyPassword,
      setProxyPort,
    },
    handleChange,
    errors,
    setErrors,
  };
};
