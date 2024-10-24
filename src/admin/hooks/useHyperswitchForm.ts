import { useState } from "react";
import { FormErrors } from "../../types";

export const useHyperswitchForm = () => {
  const [publishableKey, setPublishableKey] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [paymentHashKey, setPaymentHashKey] = useState<string>("");
  const [webhookURL, setWebhookURL] = useState<string>("");
  const [environment, setEnvironment] = useState<string>("sandbox");
  const [captureMethod, setCaptureMethod] = useState<string>("manual");
  const [enableSaveCards, setEnableSaveCards] = useState<boolean>(false);
  const [appearence, setAppearence] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = {
    publishableKey: (event: React.ChangeEvent<HTMLInputElement>) =>
      setPublishableKey(event.target.value),
    secretKey: (event: React.ChangeEvent<HTMLInputElement>) =>
      setSecretKey(event.target.value),
    paymentHashKey: (event: React.ChangeEvent<HTMLInputElement>) =>
      setPaymentHashKey(event.target.value),
    webhookURL: (event: React.ChangeEvent<HTMLInputElement>) =>
      setWebhookURL(event.target.value),
    environment: (value: string) => setEnvironment(value),
    captureMethod: (value: string) => setCaptureMethod(value),
    enableSaveCards: (checked: boolean) => setEnableSaveCards(checked),
    appearence: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setAppearence(event.target.value),
  };

  return {
    formState: {
    publishable_key: publishableKey,
    secret_key: secretKey,
    payment_hash_key: paymentHashKey,
    webhook_url: webhookURL,
    environment,
    capture_method: captureMethod,
    enable_save_cards: enableSaveCards,
    appearence,
    },
    formSetters: {
      setpublishable_key:setPublishableKey,
      setsecret_key:setSecretKey,
      setpayment_hash_key:setPaymentHashKey,
      setwebhook_url:setWebhookURL,
      setenvironment:setEnvironment,
      setcapture_method:setCaptureMethod,
      setenable_save_cards:setEnableSaveCards,
      setappearence:setAppearence,

      
    },
    handleChange,
    isEditing,
    setIsEditing,
    errors,
    setErrors,
  };
};
