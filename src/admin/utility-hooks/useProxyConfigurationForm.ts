import { useState } from "react";

import { ProxyTypes, ProxyFormErrors } from "../../types/components-types";

export const useProxyConfigurationForm = () => {
  const [isActive, setProxyIsActive] = useState<boolean>(false);
  const [url, setProxyUrl] = useState<string>("");
  const [protocol, setProxyProtocol] = useState<("http"|"https")>("http");
  const [host, setProxyHost] = useState<string>("");
  const [username, setProxyUsername] = useState<string>("");
  const [password, setProxyPassword] = useState<string>("");
  const [port, setProxyPort] = useState<number>();
  const [errors, setErrors] = useState<ProxyFormErrors>({});
  const handleChange = {
    activeProxy: (checked: boolean) => setProxyIsActive(checked),
    proxyHost: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyHost(event.target.value),
    proxyUrl: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyUrl(event.target.value),
    proxyUsername: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyUsername(event.target.value),
    proxyPassword: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyPassword(event.target.value),
    proxyProtocol: (value: "http" | "https") => setProxyProtocol(value),
    proxyPort: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProxyPort(Number(event.target.value)),
  };

  return {
    formState: {
      isActive,
      host,
      protocol,
      url,
      username,
      password,
      port
    } as ProxyTypes,
    formSetters: {
      setProxyIsActive,
      setProxyProtocol,
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
