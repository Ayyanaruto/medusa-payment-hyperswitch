import { PaymentProcessorSessionResponse } from "@medusajs/medusa";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import Logger from "../utils/logger";

export const HYPERSWITCH_API_PATH = process.env.NODE_ENV === "production" ? "https://api.hyperswitch.io" : "https://sandbox.hyperswitch.io";

type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

interface HyperSwitchResponse<T> {
    status: number;
    data: T;
}

export enum TransactionStatus {
    SUCCEEDED = "succeeded",
    FAILED = "failed",
    CANCELLED = "cancelled",
    PROCESSING = "processing",
    REQUIRES_CUSTOMER_ACTION = "requires_customer_action",
    REQUIRES_MERCHANT_ACTION = "requires_merchant_action",
    REQUIRES_PAYMENT_METHOD = "requires_payment_method",
    REQUIRES_CONFIRMATION = "requires_confirmation",
    REQUIRES_CAPTURE = "requires_capture",
    PARTIALLY_CAPTURED = "partially_captured",
    PARTIALLY_CAPTURED_AND_CAPTURABLE = "partially_captured_and_capturable",
}

interface RequestOptions {
    path: string;
    method: HTTPMethod;
    headers?: Record<string, string>;
    body?: Record<string, unknown> | TransactionCreateParams | TransactionUpdateParams;
    query?: Record<string, unknown>;
}

interface TransactionCreateParams {
    amount: number;
    currency: string;
    payment_experience?: string;
    capture_method?: string;
    confirm?: boolean;
    setup_future_usage: string;
    billing?: Record<string, unknown>;
    customer?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

interface TransactionUpdateParams {
    payment_id: string;
    payment_experience?: string;
    confirm?: boolean;
    amount: number;
    billing?: Record<string, unknown>;
    customer?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    return_url?: string;
    customer_id?: string;
    capture_method?: string;
}

interface TransactionFetchParams {
    payment_id: string;
    amount_to_capture?: number;
}

interface TransactionResponse extends PaymentProcessorSessionResponse {
    payment_id: string;
    client_secret: string;
    amount: number;
    currency: string;
    status: string;
    capture_method: string;
    setup_future_usage: string;
    billing?: Record<string, unknown>;
    customer?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    expires_at: string;
    confirmed_at: string;
    captured_at: string;
    refunded_at: string;
    voided_at: string;
    error?: Record<string, unknown>;
    browser_info?: string;
    payment_method?: string;
    connector?: string;
}

class HyperSwitchApiClient {
    private readonly axiosInstance: AxiosInstance;
    private readonly logger: Logger;

    constructor(apiKey: string) {
        this.axiosInstance = axios.create({
            baseURL: HYPERSWITCH_API_PATH,
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey,
            },
        });
        axiosRetry(this.axiosInstance, { retries: 3 });
        this.logger = new Logger();
    }

    async request<T>(options: RequestOptions): Promise<HyperSwitchResponse<T>> {
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

    private logApiResponse<T>(options: RequestOptions, response: AxiosResponse<T>, responseTime: number): void {
        const responseData = response.data as unknown as TransactionResponse;
        this.logger.logApi("INFO", "Request to HyperSwitch API", {
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
            userAgent: response.headers['user-agent'] ?? 'Unknown',
            clientIp: response.headers['x-forwarded-for'] ?? 'Unknown',
            requestId: response.headers['x-request-id'],
        });
    }

    private handleError(error: unknown, options: RequestOptions): never {
        if (axios.isAxiosError(error)) {
            this.logger.error(`Error from HyperSwitch API: ${error.response?.status}`, {
                requestOptions: options,
                responseData: error.response?.data,
                responseHeaders: error.response?.headers,
                requestConfig: error.config,
            });
            throw new Error(
                `Error from HyperSwitch with status code ${error.response?.status}: ${JSON.stringify(error.response?.data)}`
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

    async create(params: TransactionCreateParams): Promise<HyperSwitchResponse<TransactionResponse>> {
        return this.apiClient.request<TransactionResponse>({
            path: "/payments",
            method: "POST",
            body: params,
        });
    }

    async update(params: TransactionUpdateParams): Promise<HyperSwitchResponse<TransactionResponse>> {
        return this.apiClient.request<TransactionResponse>({
            path: `/payments/${params.payment_id}`,
            method: "POST",
            body: params,
        });
    }

    async fetch(params: TransactionFetchParams): Promise<HyperSwitchResponse<TransactionResponse>> {
        return this.apiClient.request<TransactionResponse>({
            path: `/payments/${params.payment_id}`,
            method: "GET",
        });
    }

    async capture(params: TransactionFetchParams): Promise<HyperSwitchResponse<TransactionResponse>> {
        return this.apiClient.request<TransactionResponse>({
            path: `/payments/${params.payment_id}/capture`,
            method: "POST",
            body: {
                amount_to_capture: params.amount_to_capture,
            },
        });
    }

    async cancel(params: TransactionFetchParams): Promise<HyperSwitchResponse<TransactionResponse>> {
        return this.apiClient.request<TransactionResponse>({
            path: `/payments/${params.payment_id}/cancel`,
            method: "POST",
            body: {
                cancellation_reason: "requested_by_customer",
            },
        });
    }

    async refund(params: TransactionFetchParams): Promise<HyperSwitchResponse<TransactionResponse>> {
        return this.apiClient.request<TransactionResponse>({
            path: `/refunds`,
            method: "POST",
            body: {
                payment_id: params.payment_id,
            },
        });
    }
}

export default class HyperSwitch {
    private readonly apiClient: HyperSwitchApiClient;
    public readonly transactions: HyperSwitchTransactions;

    constructor(apiKey: string) {
        this.apiClient = new HyperSwitchApiClient(apiKey);
        this.transactions = new HyperSwitchTransactions(this.apiClient);
    }
}
