import { CredentialsType,FormErrors } from "../../../types";


export const validateForm = (data: CredentialsType, setErrors: (errors: FormErrors) => void): boolean => {
  const newErrors: FormErrors = {};
  let isValid = true;

  if (!data.publishable_key) {
    newErrors.publishable_key = "Publishable key is required";
    isValid = false;
  } else if (
    typeof data.publishable_key !== "string" ||
    !data.publishable_key.startsWith("pk_")
  ) {
    newErrors.publishable_key = "Publishable key must start with 'pk_'";
    isValid = false;
  }

  if (!data.secret_key) {
    newErrors.secret_key = "Secret key is required";
    isValid = false;
  } else if (typeof data.secret_key !== "string" || !data.secret_key.startsWith("snd_")) {
    newErrors.secret_key = "Secret key must start with 'snd_'";
    isValid = false;
  }

  if (!data.payment_hash_key) {
    newErrors.payment_hash_key = "Payment hash key is required";
    isValid = false;
  }

  if (!data.webhook_url) {
    newErrors.webhook_url = "Webhook URL is required";
    isValid = false;
  } else {
    try {
      new URL(data.webhook_url);
    } catch (e) {
      newErrors.webhook_url = "Please enter a valid URL";
      isValid = false;
    }
  }

  if (!data.environment) {
    newErrors.environment = "Environment is required";
    isValid = false;
  }

  if (!data.capture_method) {
    newErrors.capture_method = "Capture method is required";
    isValid = false;
  }

  setErrors(newErrors);
  return isValid;
};
