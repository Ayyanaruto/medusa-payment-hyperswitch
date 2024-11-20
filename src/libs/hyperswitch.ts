import {
  TransactionCreateParams,
  TransactionFetchParams,
  TransactionCancelParams,
  TransactionCaptureParams,
  HyperSwitchResponse,
  TransactionRefundParams,
  TransactionResponse,
  TransactionUpdateParams,
  TransactionAuthorizeParams
} from "../types/libs-types";

import { ProxyType } from "src/types/models-types";

import { HyperSwitchApiClient } from "./configs/hyperswitchApiClient";
import { ProxyTypes } from "src/types/components-types";

class HyperSwitchTransactions {
  private readonly apiClient: HyperSwitchApiClient;

  constructor(apiClient: HyperSwitchApiClient) {
    this.apiClient = apiClient;
  }

  public async create(
    params: TransactionCreateParams
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return await  this.apiClient.request<TransactionResponse>({
      path: "/payments",
      method: "POST",
      body: params,
    });

  }

  public async update(
    params: TransactionUpdateParams
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return this.apiClient.request<TransactionResponse>({
      path: `/payments/${params.payment_id}`,
      method: "POST",
      body: params,
    });
  }

  public async fetch(
    params: TransactionFetchParams
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return this.apiClient.request<TransactionResponse>({
      path: `/payments/${params.payment_id}`,
      method: "GET",
    });
  }

  public async capture(
    params: TransactionCaptureParams
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return this.apiClient.request<TransactionResponse>({
      path: `/payments/${params.payment_id}/capture`,
      method: "POST",
      body: {
        cancellation_reason: "requested_by_customer",
      },
    });
  }

  // public async authorize(
  //   params: TransactionAuthorizeParams
  // ): Promise<HyperSwitchResponse<TransactionResponse>> {
  //   console.log("Authorize Payment", params.client_secret);
  //   return this.apiClient.request<TransactionResponse>({
  //     path: `/payments/${params.payment_id}/complete_authorize`,
  //     method: "POST",
  //     body: {
  //       client_secret:params.client_secret,
  //     },
  //   });
  // }

  public async cancel(
    params: TransactionCancelParams
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
    return this.apiClient.request<TransactionResponse>({
      path: `/payments/${params.payment_id}/cancel`,
      method: "POST",
      body: {
        cancellation_reason: "requested_by_customer",
      },
    });
  }

  public async refund(
    params: TransactionRefundParams
  ): Promise<HyperSwitchResponse<TransactionResponse>> {
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
  public readonly apiClient: HyperSwitchApiClient;
  public readonly transactions: HyperSwitchTransactions;

  constructor(apiKey: string, environment: string, proxy?: ProxyTypes) {
    this.apiClient = new HyperSwitchApiClient(apiKey, environment, proxy);
    this.transactions = new HyperSwitchTransactions(this.apiClient);
  }
}
