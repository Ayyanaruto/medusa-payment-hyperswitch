import { ConfigurationTypes,FormErrors } from "../../types/components-types";

const isValidString = (value: string, prefix: string): boolean => {
  return typeof value === "string" && value.startsWith(prefix);
};

export const validateConfigurationsForm = (data: ConfigurationTypes): FormErrors => {
  const errors: FormErrors = {};

  if (!data.publishableKey) {
    errors.publishable_key = "Publishable key is required";
  } else if (!isValidString(data.publishableKey, "pk_")) {
    errors.publishable_key = "Publishable key must start with 'pk_'";
  }

  if (!data.secretKey) {
    errors.secret_key = "Secret key is required";
  } else if (!isValidString(data.secretKey, "snd_")) {
    errors.secret_key = "Secret key must start with 'snd_'";
  }

  if (!data.paymentHashKey) {
    errors.payment_hash_key = "Payment hash key is required";
  }

  if (!data.environment) {
    errors.environment = "Environment is required";
  }

  if (!data.captureMethod) {
    errors.capture_method = "Capture method is required";
  }

  return errors;
};

export const validateConfigForm = (
  data: ConfigurationTypes,
  setErrors: (errors: FormErrors) => void
): boolean => {
  const errors = validateConfigurationsForm(data);
  const isValid = Object.keys(errors).length === 0;
  setErrors(errors);
  return isValid;
};
