import { ProxyTypes, ProxyFormErrors } from "../../types/components-types";

const isValidHost = (host: string): boolean => {
  const hostPattern =
    /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}|(?:\d{1,3}\.){3}\d{1,3})$/;
  return hostPattern.test(host);
};

const isValidPort = (port: string): boolean => {
  const portNumber = Number(port);
  return !isNaN(portNumber) && portNumber > 0 && portNumber <= 65535;
};

const validateProxy = (data: ProxyTypes): ProxyFormErrors => {
  const errors: ProxyFormErrors = {};

  if (!data.host) {
    errors.host = "Host is required";
  } else if (!isValidHost(data.host)) {
    errors.host = "Host is not in correct format";
  }

  if (!data.port) {
    errors.port = "Port is required";
  } else if (!isValidPort(String(data.port))) {
    errors.port = "Port must be a number between 1 and 65535";
  }

  if (data.username && !data.password) {
    errors.password = "Password is required when username is provided";
  }

  if (data.url) {
    try {
      new URL(data.url);
    } catch {
      errors.url = "Please enter a valid URL";
    }
  }

  return errors;
};

export const validateProxyConfigurationForm = (
  data: ProxyTypes,
  setErrors: (errors: ProxyFormErrors) => void
): boolean => {
  const errors = validateProxy(data);
  const isValid = Object.keys(errors).length === 0;
  setErrors(errors);
  return isValid;
};
