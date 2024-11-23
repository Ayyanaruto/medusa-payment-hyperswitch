import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import { handleApiLogs } from "@/src/utils/logger";
import { Logger } from "@/src/utils";
import { RequestOptions, HyperSwitchResponse } from "@/src/types/libs-types";
import { ProxyTypes } from "@/src/types/components-types";
import { HttpsProxyAgent } from "https-proxy-agent";

export class HyperSwitchApiClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly logger: Logger;
  public readonly proxy: ProxyTypes;

  constructor(apiKey: string, environment: string, proxy?: ProxyTypes) {
    this.proxy = proxy;
    const HYPERSWITCH_API_PATH =
      environment === "production"
        ? "https://api.hyperswitch.io"
        : "https://sandbox.hyperswitch.io";

    this.axiosInstance = this.createAxiosInstance(
      apiKey,
      HYPERSWITCH_API_PATH,
      proxy
    );
  }

  private createAxiosInstance(
    apiKey: string,
    baseURL: string,
    proxy?: ProxyTypes
  ): AxiosInstance {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: baseURL,
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
    };

    if (
      proxy?.isActive &&
      proxy?.host &&
      proxy?.port
    ) {
      this.configureProxy(axiosConfig, proxy);
    }

    const instance = axios.create(axiosConfig);
    this.configureAxiosRetry(instance);

    return instance;
  }

  private configureProxy(
    axiosConfig: AxiosRequestConfig,
    proxy: ProxyTypes
  ): void {
    const proxyUrl =
      proxy.username && proxy.password
        ? `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
        : `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    const agent = new HttpsProxyAgent(proxyUrl);
    axiosConfig.proxy = false;
    axiosConfig.httpsAgent = agent;

    this.logger.debug(
      "Configuring Proxy",
      {
        host: proxy.host,
        port: proxy.port,
        hasCredentials: !!(proxy.username && proxy.password),
      },
      "PROXY CONFIGURATION"
    );
  }

  private configureAxiosRetry(instance: AxiosInstance): void {
    axiosRetry(instance, {
      retries: 3,
      retryDelay: (retryCount) => retryCount * 1000,
      retryCondition: (error) => {
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status >= 500 && error.response?.status <= 599)
        );
      },
    });
  }
  public async request<T>(
    options: RequestOptions
  ): Promise<HyperSwitchResponse<T>> {
    const config: AxiosRequestConfig = {
      method: options.method,
      url: options.path,
      headers: options.headers,
      params: options.query,
      data: options.body,
    };

    try {
      const start = Date.now();
      const response = await this.axiosInstance.request<T>(config);
      const responseTime = Date.now() - start;

      handleApiLogs({
        message: "HyperSwitch API request successful",
        source: "HYPESWITCH_API_CLIENT",
        method: options.method,
        url: options.path,
        status: response.status,
        responseTime: responseTime,
        requestBody: options.body,
        responseBody: response.data,
        headers: response.headers,
      });

      return {
        data: response.data,
      };
    } catch (error) {
      this.handleError(error, options);
    }
  }

  private handleError(error: unknown, options: RequestOptions): never {
    if (axios.isAxiosError(error)) {
      handleApiLogs({
        message: "HyperSwitch API request failed",
        source: "HYPESWITCH_API_CLIENT",
        method: options.method,
        url: options.path,
        status: error.response?.status,
        responseTime: 0,
        requestBody: options.body,
        responseBody: error.response?.data,
        headers: error.response?.headers,
        error: error,
      });
      throw new Error(
        `Error from HyperSwitch with status code ${
          error.response?.status
        }: ${JSON.stringify(error.response?.data)}`
      );
    }
    throw new Error(`Error from HyperSwitch API: ${(error as Error).message}`);
  }
}
