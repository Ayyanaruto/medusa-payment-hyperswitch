import type { MedusaRequest, MedusaResponse, PaymentProcessorContext } from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import HyperswitchPaymentProcessor from "../../services/hyperswith-payment-processor";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    const start = Date.now();
    try {
        const context: PaymentProcessorContext = {
            amount: 9000,
            currency_code: "usd",
            resource_id: "123",
            email: "    ",
            context: {
                cart_id: "123",
            },
            paymentSessionData: {
                payment_method: "card",
                card: {
                    number: "4242424242424242",
                    exp_month: 12,
                    exp_year: 2022,
                    cvc: "123",
                },
            },
        };

        const hyperswitch = req.scope.resolve<HyperswitchPaymentProcessor>("hyperswithPaymentProcessorService");
        const resp = await hyperswitch.initiatePayment(context);

        console.log(">>>>Test", resp);

        return { resp };
    } catch (error) {
        const responseTime = Date.now() - start;
        console.error(`Error occurred after ${responseTime}ms:`, error);

        throw new MedusaError(MedusaError.Types.DB_ERROR, error.message);
    }
};
