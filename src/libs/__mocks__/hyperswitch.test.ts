import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { TransactionCreateParams, TransactionUpdateParams, TransactionFetchParams, TransactionResponse } from '../../types';

interface HyperSwitchResponse<T> {
    status: number;
    data: T;
}

const apiKey = 'valid_api_key';
const request = axios.create({
        baseURL: 'http://localhost:3000',
        headers: {
                'Content-Type': 'application/json',
                "api-key": apiKey
        }
});
const hyperSwitch = {
        transactions: {
                create: async (params: TransactionCreateParams): Promise<HyperSwitchResponse<TransactionResponse>> => {
                        return request.post('/payments', params);
                },
                update: async (params: TransactionUpdateParams): Promise<HyperSwitchResponse<TransactionResponse>> => {
                        return request.post(`/payments/${params.payment_id}`, params);
                },
                fetch: async (params: TransactionFetchParams): Promise<HyperSwitchResponse<TransactionResponse>> => {
                        return request.get(`/payments/${params.payment_id}`);
                },
                capture: async (params: TransactionFetchParams): Promise<HyperSwitchResponse<TransactionResponse>> => {
                        return request.post(`/payments/${params.payment_id}/capture`, { amount_to_capture: params.amount_to_capture });
                },
                cancel: async (params: TransactionFetchParams): Promise<HyperSwitchResponse<TransactionResponse>> => {
                        return request.post(`/payments/${params.payment_id}/cancel`, { cancellation_reason: 'requested_by_customer' });
                },
                refund: async (params: TransactionFetchParams): Promise<HyperSwitchResponse<TransactionResponse>> => {
                        return request.post('/refunds', { payment_id: params.payment_id });
                },
        },
};
const mock = new MockAdapter(axios);
const errorResponses = {
        invalidApiKey: {
                error: {
                        type: 'invalid_request',
                        message: 'API key not provided or invalid API key used',
                        code: 'IR_01'
                }
        },
        paymentNotFound: {
                error: {
                        type: 'not_found',
                        message: 'Payment not found',
                        code: 'NF_01'
                }
        },
        invalidPaymentAmount: {
                error: {
                        type: 'invalid_request',
                        message: 'Invalid payment amount',
                        code: 'IR_02'
                }
        },
        paymentAlreadyCaptured: {
                error: {
                        type: 'invalid_request',
                        message: 'Payment already captured',
                        code: 'IR_03'
                }
        },
        paymentAlreadyCancelled: {
                error: {
                        type: 'invalid_request',
                        message: 'Payment already cancelled',
                        code: 'IR_04'
                }
        },
        paymentAlreadyRefunded: {
                error: {
                        type: 'invalid_request',
                        message: 'Payment already refunded',
                        code: 'IR_05'
                }
        }
};

describe('HyperSwitch API Client', () => {
        afterEach(() => {
                mock.reset();
        });

        it('should create a transaction 📝', async () => {
                const createParams: TransactionCreateParams = {
                        amount: 1000,
                        currency: 'USD',
                        setup_future_usage: 'off_session',
                };

                const mockResponse: TransactionResponse = {
                        cart_id: 'test_cart_id',
                        payment_id: 'test_payment_id',
                        client_secret: 'test_client_secret',
                        amount: 1000,
                        currency: 'USD',
                        status: 'succeeded',
                        capture_method: 'automatic',
                        setup_future_usage: 'off_session',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        expires_at: new Date().toISOString(),
                        confirmed_at: new Date().toISOString(),
                        captured_at: new Date().toISOString(),
                        refunded_at: new Date().toISOString(),
                        voided_at: new Date().toISOString(),
                        session_data: undefined
                };

                mock.onPost('/payments').reply(200, mockResponse);

                const response = await hyperSwitch.transactions.create(createParams);

                expect(response.status).toBe(200);
                expect(response.data).toEqual(mockResponse);
        });

        it('should handle invalid API key error 🚫', async () => {
                const createParams: TransactionCreateParams = {
                        amount: 1000,
                        currency: 'USD',
                        setup_future_usage: 'off_session',
                };

                mock.onPost('/payments').reply(401, errorResponses.invalidApiKey);

                try {
                        await hyperSwitch.transactions.create(createParams);
                } catch (error) {
                        expect(error.response.status).toBe(401);
                        expect(error.response.data).toEqual(errorResponses.invalidApiKey);
                }
        });

        it('should update a transaction 🔄', async () => {
                const updateParams: TransactionUpdateParams = {
                        payment_id: 'test_payment_id',
                        amount: 1000,
                };

                const mockResponse: TransactionResponse = {
                        cart_id: 'test_cart_id',
                        payment_id: 'test_payment_id',
                        client_secret: 'test_client_secret',
                        amount: 1000,
                        currency: 'USD',
                        status: 'succeeded',
                        capture_method: 'automatic',
                        setup_future_usage: 'off_session',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        expires_at: new Date().toISOString(),
                        confirmed_at: new Date().toISOString(),
                        captured_at: new Date().toISOString(),
                        refunded_at: new Date().toISOString(),
                        voided_at: new Date().toISOString(),
                        session_data: undefined
                };

                mock.onPost(`/payments/${updateParams.payment_id}`).reply(200, mockResponse);

                const response = await hyperSwitch.transactions.update(updateParams);

                expect(response.status).toBe(200);
                expect(response.data).toEqual(mockResponse);
        });

        it('should handle payment not found error on update ❌', async () => {
                const updateParams: TransactionUpdateParams = {
                        payment_id: 'non_existent_payment_id',
                        amount: 1000,
                };

                mock.onPost(`/payments/${updateParams.payment_id}`).reply(404, errorResponses.paymentNotFound);

                try {
                        await hyperSwitch.transactions.update(updateParams);
                } catch (error) {
                        expect(error.response.status).toBe(404);
                        expect(error.response.data).toEqual(errorResponses.paymentNotFound);
                }
        });

        it('should fetch a transaction 🔍', async () => {
                const fetchParams: TransactionFetchParams = {
                        payment_id: 'test_payment_id',
                };

                const mockResponse: TransactionResponse = {
                        cart_id: 'test_cart_id',
                        payment_id: 'test_payment_id',
                        client_secret: 'test_client_secret',
                        amount: 1000,
                        currency: 'USD',
                        status: 'succeeded',
                        capture_method: 'automatic',
                        setup_future_usage: 'off_session',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        expires_at: new Date().toISOString(),
                        confirmed_at: new Date().toISOString(),
                        captured_at: new Date().toISOString(),
                        refunded_at: new Date().toISOString(),
                        voided_at: new Date().toISOString(),
                        session_data: undefined
                };

                mock.onGet(`/payments/${fetchParams.payment_id}`).reply(200, mockResponse);

                const response = await hyperSwitch.transactions.fetch(fetchParams);

                expect(response.status).toBe(200);
                expect(response.data).toEqual(mockResponse);
        });

        it('should handle payment not found error on fetch ❌', async () => {
                const fetchParams: TransactionFetchParams = {
                        payment_id: 'non_existent_payment_id',
                };

                mock.onGet(`/payments/${fetchParams.payment_id}`).reply(404, errorResponses.paymentNotFound);

                try {
                        await hyperSwitch.transactions.fetch(fetchParams);
                } catch (error) {
                        expect(error.response.status).toBe(404);
                        expect(error.response.data).toEqual(errorResponses.paymentNotFound);
                }
        });

        it('should capture a transaction 💰', async () => {
                const captureParams: TransactionFetchParams = {
                        payment_id: 'test_payment_id',
                        amount_to_capture: 1000,
                };

                const mockResponse: TransactionResponse = {
                        cart_id: 'test_cart_id',
                        payment_id: 'test_payment_id',
                        client_secret: 'test_client_secret',
                        amount: 1000,
                        currency: 'USD',
                        status: 'succeeded',
                        capture_method: 'automatic',
                        setup_future_usage: 'off_session',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        expires_at: new Date().toISOString(),
                        confirmed_at: new Date().toISOString(),
                        captured_at: new Date().toISOString(),
                        refunded_at: new Date().toISOString(),
                        voided_at: new Date().toISOString(),
                        session_data: undefined
                };

                mock.onPost(`/payments/${captureParams.payment_id}/capture`).reply(200, mockResponse);

                const response = await hyperSwitch.transactions.capture(captureParams);

                expect(response.status).toBe(200);
                expect(response.data).toEqual(mockResponse);
        });

        it('should handle payment already captured error ❌', async () => {
                const captureParams: TransactionFetchParams = {
                        payment_id: 'test_payment_id',
                        amount_to_capture: 1000,
                };

                mock.onPost(`/payments/${captureParams.payment_id}/capture`).reply(400, errorResponses.paymentAlreadyCaptured);

                try {
                        await hyperSwitch.transactions.capture(captureParams);
                } catch (error) {
                        expect(error.response.status).toBe(400);
                        expect(error.response.data).toEqual(errorResponses.paymentAlreadyCaptured);
                }
        });

        it('should cancel a transaction ❌', async () => {
                const cancelParams: TransactionFetchParams = {
                        payment_id: 'test_payment_id',
                };

                const mockResponse: TransactionResponse = {
                        cart_id: 'test_cart_id',
                        payment_id: 'test_payment_id',
                        client_secret: 'test_client_secret',
                        amount: 1000,
                        currency: 'USD',
                        status: 'cancelled',
                        capture_method: 'automatic',
                        setup_future_usage: 'off_session',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        expires_at: new Date().toISOString(),
                        confirmed_at: new Date().toISOString(),
                        captured_at: new Date().toISOString(),
                        refunded_at: new Date().toISOString(),
                        voided_at: new Date().toISOString(),
                        session_data: undefined
                };

                mock.onPost(`/payments/${cancelParams.payment_id}/cancel`).reply(200, mockResponse);

                const response = await hyperSwitch.transactions.cancel(cancelParams);

                expect(response.status).toBe(200);
                expect(response.data).toEqual(mockResponse);
        });

        it('should handle payment already cancelled error ❌', async () => {
                const cancelParams: TransactionFetchParams = {
                        payment_id: 'test_payment_id',
                };

                mock.onPost(`/payments/${cancelParams.payment_id}/cancel`).reply(400, errorResponses.paymentAlreadyCancelled);

                try {
                        await hyperSwitch.transactions.cancel(cancelParams);
                } catch (error) {
                        expect(error.response.status).toBe(400);
                        expect(error.response.data).toEqual(errorResponses.paymentAlreadyCancelled);
                }
        });

        it('should refund a transaction 💸', async () => {
                const refundParams: TransactionFetchParams = {
                        payment_id: 'test_payment_id',
                };

                const mockResponse: TransactionResponse = {
                        cart_id: 'test_cart_id',
                        payment_id: 'test_payment_id',
                        client_secret: 'test_client_secret',
                        amount: 1000,
                        currency: 'USD',
                        status: 'refunded',
                        capture_method: 'automatic',
                        setup_future_usage: 'off_session',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        expires_at: new Date().toISOString(),
                        confirmed_at: new Date().toISOString(),
                        captured_at: new Date().toISOString(),
                        refunded_at: new Date().toISOString(),
                        voided_at: new Date().toISOString(),
                        session_data: undefined
                };

                mock.onPost('/refunds').reply(200, mockResponse);

                const response = await hyperSwitch.transactions.refund(refundParams);

                expect(response.status).toBe(200);
                expect(response.data).toEqual(mockResponse);
        });

        it('should handle payment already refunded error ❌', async () => {
                const refundParams: TransactionFetchParams = {
                        payment_id: 'test_payment_id',
                };

                mock.onPost('/refunds').reply(400, errorResponses.paymentAlreadyRefunded);

                try {
                        await hyperSwitch.transactions.refund(refundParams);
                } catch (error) {
                        expect(error.response.status).toBe(400);
                        expect(error.response.data).toEqual(errorResponses.paymentAlreadyRefunded);
                }
        });
});
