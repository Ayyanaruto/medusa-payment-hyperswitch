import { http, HttpResponse, HttpResponseInit } from 'msw';
import { setupServer } from 'msw/node';
import { HYPERSWITCH_API_PATH, TransactionStatus } from '../hyperswitch';

interface PaymentRequestBody {
  amount: number;
  currency: string;
  capture_method?: string;
  setup_future_usage?: string;
  billing?: object;
  customer?: object;
  metadata?: object;
}

interface UpdatePaymentRequestBody {
  amount: number;
}

interface CapturePaymentRequestBody {
  amount_to_capture: number;
}

interface RefundRequestBody {
  payment_id: string;
  amount?: number;
}

const handlers = [
  // Create payment
  http.post(`${HYPERSWITCH_API_PATH}/payments`, async req => {
    const body: PaymentRequestBody = await req.request.json() as PaymentRequestBody;

    return HttpResponse.json({
      payment_id: `pay_${Math.random().toString(36).slice(2)}`,
      client_secret: `secret_${Math.random().toString(36).slice(2)}`,
      amount: body.amount,
      currency: body.currency,
      status: TransactionStatus.REQUIRES_CONFIRMATION,
      capture_method: body.capture_method || 'automatic',
      setup_future_usage: body.setup_future_usage,
      billing: body.billing,
      customer: body.customer,
      metadata: body.metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      confirmed_at: null,
      captured_at: null,
      refunded_at: null,
      voided_at: null,
      connector: 'stripe',
      payment_method: 'card',
    });
  }),

  // Update payment
  http.post(`${HYPERSWITCH_API_PATH}/payments/:payment_id`, async req => {
    const { payment_id } = req.params;
    const body: UpdatePaymentRequestBody = await req.request.json() as UpdatePaymentRequestBody;

    switch (payment_id) {
      case 'pay_failed':
        return HttpResponse.json({
          payment_id,
          status: TransactionStatus.FAILED,
          error: {
            message: 'Payment failed',
            code: 'payment_failed',
          },
        });

      case 'pay_requires_action':
        return HttpResponse.json({
          payment_id,
          status: TransactionStatus.REQUIRES_CUSTOMER_ACTION,
          amount: body.amount,
          client_secret: `secret_${Math.random().toString(36).slice(2)}`,
          next_action: {
            type: '3ds',
            url: 'https://example.com/3ds',
          },
        });

      default:
        return HttpResponse.json({
          payment_id,
          status: TransactionStatus.SUCCEEDED,
          amount: body.amount,
          currency: 'USD',
          captured_at: new Date().toISOString(),
        });
    }
  }),

  // Get payment
  http.get(`${HYPERSWITCH_API_PATH}/payments/:payment_id`, req => {
    const { payment_id } = req.params;
    const { testRetryCount } = req.cookies;
    const retryCount = testRetryCount ? parseInt(testRetryCount) : 0;

    switch (payment_id) {
      case 'pay_succeeded':
        return HttpResponse.json({
          payment_id,
          status: TransactionStatus.SUCCEEDED,
          amount: 1000,
          currency: 'USD',
          captured_at: new Date().toISOString(),
        });

      case 'pay_processing':
        return HttpResponse.json({
          payment_id,
          status: TransactionStatus.PROCESSING,
        });

      case 'pay_retry': {
        // Fail first 2 attempts, succeed on 3rd
        if (retryCount < 2) {
          return new HttpResponse(null, {
            status: 500,
            headers: {
              'Set-Cookie': `testRetryCount=${retryCount + 1}`,
            },
          } as HttpResponseInit);
        }

        return HttpResponse.json(
          {
            payment_id,
            status: TransactionStatus.SUCCEEDED,
            amount: 1000,
            currency: 'USD',
          },
          {
            headers: {
              'Set-Cookie': 'testRetryCount=0',
            },
          } as HttpResponseInit,
        );
      }

      default:
        return HttpResponse.json({
          payment_id,
          status: TransactionStatus.FAILED,
          error: {
            message: 'Payment not found',
            code: 'payment_not_found',
          },
        });
    }
  }),

  // Capture payment
  http.post(
    `${HYPERSWITCH_API_PATH}/payments/:payment_id/capture`,
    async req => {
      const { payment_id } = req.params;
      const body: CapturePaymentRequestBody = await req.request.json() as CapturePaymentRequestBody;

      return HttpResponse.json({
        payment_id,
        status: TransactionStatus.SUCCEEDED,
        amount: body.amount_to_capture,
        currency: 'USD',
        captured_at: new Date().toISOString(),
      });
    },
  ),

  // Cancel payment
  http.post(`${HYPERSWITCH_API_PATH}/payments/:payment_id/cancel`, req => {
    const { payment_id } = req.params;

    return HttpResponse.json({
      payment_id,
      status: TransactionStatus.CANCELLED,
      voided_at: new Date().toISOString(),
    });
  }),

  // Create refund
  http.post(`${HYPERSWITCH_API_PATH}/refunds`, async req => {
    const body: RefundRequestBody = await req.request.json() as RefundRequestBody;

    return HttpResponse.json({
      refund_id: `ref_${Math.random().toString(36).slice(2)}`,
      payment_id: body.payment_id,
      status: TransactionStatus.SUCCEEDED,
      amount: body.amount || 1000,
      currency: 'USD',
      created_at: new Date().toISOString(),
    });
  }),
];

export const hyperSwitchMockServer = setupServer(...handlers);
