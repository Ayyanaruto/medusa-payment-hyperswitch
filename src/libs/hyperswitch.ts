import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import Logger from '../utils/logger';
import {
  RequestOptions,
  TransactionCreateParams,
  TransactionUpdateParams,
  TransactionFetchParams,
  TransactionResponse,
  HyperSwitchResponse,
  ProxyTypes
} from '../types';
import { testProxyConfiguration } from './__mocks__/test_proxy.test';
import { HttpsProxyAgent } from 'https-proxy-agent';

class HyperSwitchApiClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly logger: Logger;
  public readonly proxy: ProxyTypes;

  constructor(apiKey: string, environment: string, proxy?: ProxyTypes) {
    this.proxy = proxy;
    const HYPERSWITCH_API_PATH =
      environment === 'production'
        ? 'https://api.hyperswitch.io'
        : 'https://sandbox.hyperswitch.io';

    this.logger = new Logger();
    this.axiosInstance = this.createAxiosInstance(apiKey, HYPERSWITCH_API_PATH, proxy);
  }

  private createAxiosInstance(apiKey: string, baseURL: string, proxy?: ProxyTypes): AxiosInstance {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: proxy?.url || baseURL,
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
    };

    if (proxy?.enabled && proxy?.host && proxy?.port) {
      this.configureProxy(axiosConfig, proxy);
    }

    const instance = axios.create(axiosConfig);
    this.configureAxiosRetry(instance);

    return instance;
  }

  private configureProxy(axiosConfig: AxiosRequestConfig, proxy: ProxyTypes): void {
    const proxyUrl = proxy.username && proxy.password
      ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
      : `http://${proxy.host}:${proxy.port}`;

    const agent = new HttpsProxyAgent(proxyUrl);
    axiosConfig.proxy = false;
    axiosConfig.httpsAgent = agent;

    this.logger.debug(
      'Configuring Proxy',
      {
        host: proxy.host,
        port: proxy.port,
        hasCredentials: !!(proxy.username && proxy.password)
      },
      'PROXY CONFIGURATION'
    );
  }

  private configureAxiosRetry(instance: AxiosInstance): void {
    axiosRetry(instance, {
      retries: 3,
      retryDelay: (retryCount) => retryCount * 1000,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status >= 500 && error.response?.status <= 599);
      }
    });
  }

  public async runTests(proxy: ProxyTypes): Promise<void> {
    try {

      await testProxyConfiguration(proxy);
      return;

    } catch (error) {
      this.logger.error('Failed to run proxy tests', { error });
    }
  }

  public async request<T>(options: RequestOptions): Promise<HyperSwitchResponse<T>> {
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
      this.logApiResponse(options, response, responseTime);
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      this.handleError(error, options);
    }
  }

  private logApiResponse<T>(
    options: RequestOptions,
    response: AxiosResponse<T>,
    responseTime: number,
  ): void {
    const responseData = response.data as unknown as TransactionResponse;
    this.logger.logApi(
      'INFO',
      'Request to HyperSwitch API',
      {
        requestType: options.method,
        endpoint: options.path,
        requestBody: options.body,
        requestHeaders: options.headers,
        queryParams: options.query,
        responseBody: response.data,
        responseHeaders: response.headers,
        statusCode: response.status,
        responseTime,
        connector: responseData.connector,
        payment_method: responseData.payment_method,
        browser: responseData.browser_info ?? 'Unknown',
      },
      'HYPERSWITCH PAYMENTS FLOW API',
    );
  }

  private handleError(error: unknown, options: RequestOptions): never {
    if (axios.isAxiosError(error)) {
      this.logger.error(
        `Error from HyperSwitch API: ${error.response?.status}+${JSON.stringify(error.response?.data)}`,
        {
          requestOptions: options,
          responseData: error.response?.data,
          responseHeaders: error.response?.headers,
          requestConfig: error.config,
        },
      );
      throw new Error(
        `Error from HyperSwitch with status code ${
          error.response?.status
        }: ${JSON.stringify(error.response?.data)}`,
      );
    }
    throw new Error(`Error from HyperSwitch API: ${(error as Error).message}`);
  }
}

class HyperSwitchTransactions {
  private readonly apiClient: HyperSwitchApiClient;

  constructor(apiClient: HyperSwitchApiClient) {
    this.apiClient = apiClient;
  }

  public async create(
    params: TransactionCreateParams,
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return this.apiClient.request<TransactionResponse>({
      path: '/payments',
      method: 'POST',
      body: params,
    });
  }

  public async update(
    params: TransactionUpdateParams,
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return this.apiClient.request<TransactionResponse>({
      path: `/payments/${params.payment_id}`,
      method: 'POST',
      body: params,
    });
  }

  public async fetch(
    params: TransactionFetchParams,
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return this.apiClient.request<TransactionResponse>({
      path: `/payments/${params.payment_id}`,
      method: 'GET',
    });
  }

  public async capture(
    params: TransactionFetchParams,
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return this.apiClient.request<TransactionResponse>({
      path: `/payments/${params.payment_id}/capture`,
      method: 'POST',
      body: {
        amount_to_capture: params.amount_to_capture,
      },
    });
  }

  public async cancel(
    params: TransactionFetchParams,
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return this.apiClient.request<TransactionResponse>({
      path: `/payments/${params.payment_id}/cancel`,
      method: 'POST',
      body: {
        cancellation_reason: 'requested_by_customer',
      },
    });
  }

  public async refund(
    params: TransactionFetchParams,
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return this.apiClient.request<TransactionResponse>({
      path: `/refunds`,
      method: 'POST',
      body: {
        payment_id: params.payment_id,
      },
    });
  }
}

export default class HyperSwitch {
  public readonly apiClient: HyperSwitchApiClient;
  public readonly transactions: HyperSwitchTransactions;

  constructor(apiKey: string, environment: string, proxy?: ProxyTypes) {
    this.apiClient = new HyperSwitchApiClient(apiKey, environment, proxy);
    this.transactions = new HyperSwitchTransactions(this.apiClient);
  }
}
