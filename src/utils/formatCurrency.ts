const zeroDecimalCurrencies = ["JPY", "KRW", "VND"];

export const formatCurrency = (amount: number, currency: string): string => {
    const isZeroDecimal = zeroDecimalCurrencies.includes(currency);
    const adjustedAmount = isZeroDecimal ? amount : amount / 100;

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'code',
        minimumFractionDigits: isZeroDecimal ? 0 : 2,
        maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(adjustedAmount);
};