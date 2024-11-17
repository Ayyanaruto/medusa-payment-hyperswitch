import { useState } from "react";
import {FormErrors} from "../../types/components-types"

export const useConfigurationForm = () => {
  const [publishableKey, setPublishableKey] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [paymentHashKey, setPaymentHashKey] = useState<string>("");
  const [environment, setEnvironment] = useState<("sandbox"|"production")>("sandbox");
  const [captureMethod, setCaptureMethod] = useState<("manual"|"automatic")>("manual");
  const [enableSaveCards, setEnableSaveCards] = useState<boolean>(false);
  const [profileId, setProfileId] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = {
    publishableKey: (event: React.ChangeEvent<HTMLInputElement>) =>
      setPublishableKey(event.target.value),
    secretKey: (event: React.ChangeEvent<HTMLInputElement>) =>
      setSecretKey(event.target.value),
    paymentHashKey: (event: React.ChangeEvent<HTMLInputElement>) =>
      setPaymentHashKey(event.target.value),
profileId: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProfileId(event.target.value),
    environment: (value: "sandbox" | "production") => setEnvironment(value),
    captureMethod: (value: "manual" | "automatic") => setCaptureMethod(value),
    enableSaveCards: (checked: boolean) => setEnableSaveCards(checked),
  };

  return {
    formState: {
      publishableKey,
      secretKey,
      paymentHashKey,
      profileId,
      environment,
      captureMethod,
      enableSaveCards,
    },
    formSetters: {
      setPublishableKey,
       setSecretKey,
       setPaymentHashKey,
        setProfileId,
      setEnvironment,
       setCaptureMethod,
      setEnableSaveCards,
    },
    handleChange,
    isEditing,
    setIsEditing,
    errors,
    setErrors,
  };
};

