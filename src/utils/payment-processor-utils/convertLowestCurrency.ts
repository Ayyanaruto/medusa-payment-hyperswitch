import { BigNumberInput } from "@medusajs/framework/types";
import { SUPPORTED_CURRENCIES, ZERO_DECIMAL_CURRENCIES } from "@/src/types/payment-processor-types"

import { BigNumber, MedusaError } from "@medusajs/framework/utils";


/**
 * Type for supported currency codes
 */
export type HyperSwitchCurrencyCode = string;

/**
 * Interface for amount conversion options
 */
export interface HyperSwitchAmountOptions {
  amount:BigNumberInput;
  currency: HyperSwitchCurrencyCode;
}

/**
 * Validates if a given currency code is supported
 * @param currency - The currency code to validate
 * @returns boolean indicating if the currency is supported
 */
export function isValidCurrency(currency: string): boolean {
  if (!currency) return false;
  return SUPPORTED_CURRENCIES.has(currency.trim().toUpperCase());
}

/**
 * Converts a decimal amount to HyperSwitch's integer format
 * @param options Object containing amount and currency
 * @returns Integer amount in the currency's smallest unit (cents, fils, etc.)
 * @throws Error if amount is negative or currency is invalid
 *
 * @example
 * // Convert $10.00 to cents
 * toHyperSwitchAmount({ amount: 10.00, currency: 'USD' }) // returns 1000
 *
 * // Convert ¥1000 (zero-decimal currency)
 * toHyperSwitchAmount({ amount: 1000, currency: 'JPY' }) // returns 1000
 */
export function toHyperSwitchAmount({
  amount,
  currency,
}: HyperSwitchAmountOptions): number {
  // Validate currency
  console.log(currency)
  console.log(isValidCurrency(currency as string))
  if (!isValidCurrency(currency as string)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Currency ${currency} is not supported`,
      "401"
    )
  }

  // Validate amount
  if (Number(amount) < 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Amount must be a positive number",
      "400"
    )
  }

  // For zero-decimal currencies, round to integer
  if (ZERO_DECIMAL_CURRENCIES.has(String(currency))) {
    return Math.round(Number(amount));
  }

  // For all other currencies, multiply by 100 and round to integer
  return Math.round(Number(amount) * 100);
}

/**
 * Converts a Hyperswitch integer amount back to decimal format
 * @param options Object containing amount and currency
 * @returns Decimal amount in the currency's standard unit
 * @throws Error if amount is negative or currency is invalid
 *
 * @example
 * // Convert 1000 cents to USD
 * fromHyperswitchAmount({ amount: 1000, currency: 'USD' }) // returns 10.00
 *
 * // Convert 1000 yen (zero-decimal currency)
 * fromHyperswitchAmount({ amount: 1000, currency: 'JPY' }) // returns 1000
 */
export function fromHyperSwitchAmount({ amount, currency }: { amount: number; currency: string }): number {
  if (Number(amount) < 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Amount must be a positive number",
      "400"
    );
  }

  // For zero-decimal currencies, return as is
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return amount;
  }

  // For all other currencies, divide by 100
console.log(`Converting amount ${amount} from HyperSwitch integer format to decimal for currency ${currency}`);
return amount / 100;

}
