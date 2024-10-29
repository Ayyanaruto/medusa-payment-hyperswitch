import  {  PaymentProcessorSessionResponse } from "@medusajs/medusa";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
 
export const HYPERSWITCH_API_PATH = process.env.NODE === "production" ? "https://api.hyperswitch.io" : "https://sandbox.hyperswitch.io";

type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

interface HyperSwitchResponse<T> {
    status: number;
    data: T;
}

interface RequestOptions {
    path: string;
    method: HTTPMethod;
    headers?: Record<string, string>;
    body?: Record<string, any>;
    query?: Record<string, any>;
}

interface TransactionCreateParams {
  amount: number;
  currency: string;
  payment_experience?: string;
  capture_method?: string;
  setup_future_usage: string;
  billing?: Record<string, any>;
  customer?: Record<string, any>;
  metadata?: Record<string, any>;
}

export enum PaymentMethod {
    Card = "card",
    CardRedirect = "card_redirect",
    PayLater = "pay_later",
    Wallet = "wallet",
    BankRedirect = "bank_redirect",
    BankTransfer = "bank_transfer",
    Crypto = "crypto",
    BankDebit = "bank_debit",
    Reward = "reward",
    RealTimePayment = "real_time_payment",
    UPI = "upi",
    Voucher = "voucher",
    GiftCard = "gift_card",
    OpenBanking = "open_banking",
}

interface TransactionUpdateParams {
  payment_id: string;
  payment_method?: PaymentMethod;
  payment_experience?: string;
  confirm?: boolean;
  amount: number;
  billing?: Record<string, any>;
  customer?: Record<string, any>;
  metadata?: Record<string, any>;
  return_url?: string;
  customer_id?: string;
}

interface TransactionConfirmParams {
    payment_id: string;
}

interface TransactionFetchParams {
    payment_id: string;
}

interface TransactionResponse extends PaymentProcessorSessionResponse {
    payment_id: string;
    client_secret: string;
    amount: number;
    currency: string;
    status: string;
    capture_method: string;
    setup_future_usage: string;
    billing?: Record<string, any>;
    customer?: Record<string, any>;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    expires_at: string;
    confirmed_at: string;
    captured_at: string;
    refunded_at: string;
    voided_at: string;
    error?: Record<string, any>;

    
}
export default class HyperSwitch {
    private readonly apiKey: string;
    private readonly axios: AxiosInstance;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.axios = axios.create({
            baseURL: HYPERSWITCH_API_PATH,
            headers: {
                "Content-Type": "application/json",
                "api-key": this.apiKey,
            },
        });
        axiosRetry(this.axios, { retries: 3 });
    }

    private async requestHyperSwitchApi<T>(options: RequestOptions): Promise<HyperSwitchResponse<T>> {
        const config: AxiosRequestConfig = {
            method: options.method,
            url: options.path,
            headers: options.headers,
            params: options.query,
            data: options.body,
        };

        try {
            const response = await this.axios.request<T>(config);
            return {
                status: response.status,
                data: response.data,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Error from HyperSwitch with status code ${error.response?.status}: ${error.response}`
                );
            }
            throw new Error(`Error from HyperSwitch API: ${error.message}`);
        }
    }

    transactions = {
        create: async (params: TransactionCreateParams): Promise<HyperSwitchResponse<TransactionResponse>> => {
            console.log("Creating....")
            return await this.requestHyperSwitchApi<TransactionResponse>({
                path: "/payments",
                method: "POST",
                body: params,
            });
        },
        update: async (params: TransactionUpdateParams): Promise<HyperSwitchResponse<TransactionResponse>> => {
            console.log("Updating....")
            const resp=await this.requestHyperSwitchApi<TransactionResponse>({
                path: `/payments/${params.payment_id}`,
                method: "POST",
                body: params,
            });
            return resp;
        },
        confirm: async (params: TransactionConfirmParams): Promise<HyperSwitchResponse<TransactionResponse>> => {
            return this.requestHyperSwitchApi<TransactionResponse>({
                path: `/payments/${params.payment_id}/confirm`,
                method: "POST",
                body: params,
            });
        },
        fetch: async (params: TransactionFetchParams): Promise<HyperSwitchResponse<TransactionResponse>> => {
            return this.requestHyperSwitchApi<TransactionResponse>({
                path: `/payments/${params.payment_id}`,
                method: "GET",
            });
        },
    };
}
 
