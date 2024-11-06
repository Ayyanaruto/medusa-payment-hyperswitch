import { Cart } from '@medusajs/medusa';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@medusajs/ui';

interface Appearance {
  layout: string;
  wallets: {
    walletReturnUrl: string;
  };
}

interface ButtonProps {
  'cart': Omit<Cart, 'refundable_amount' | 'refunded_total'>;
  'notReady': boolean;
  'data-testid'?: string;
  'theme'?: any;
  'styles'?: any;
}

const HyperswitchPaymentButton: React.FC<ButtonProps> = ({
  cart,
  notReady,
  'data-testid': dataTestId,
  theme,
  styles = {
    layout: 'accordion',
  },
}) => {
  const [hyper, setHyper] = useState<any>();
  const [widgets, setWidgets] = useState<any>();
  const checkoutComponent = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const scriptTag = document.createElement('script');
    scriptTag.src = 'https://beta.hyperswitch.io/v1/HyperLoader.js';

    const loadHyper = async () => {
      // @ts-ignore
      const hyperInstance = Hyper(
        'pay_G7923fNwwYPA9cYkdAga_secret_i2A2az4IXanuC9syFFW9',
      );
      setHyper(hyperInstance);

      const appearance = { theme }; // Add the appearance property
      const widgetsInstance = hyperInstance.widgets({
        appearance: appearance,
        clientSecret: 'pay_G7923fNwwYPA9cYkdAga_secret_i2A2az4IXanuC9syFFW9',
      });
      setWidgets(widgetsInstance);

      const unifiedCheckoutOptions = {
        wallets: {
          walletReturnUrl: 'https://example.com/complete',
        },
        ...styles,
      };

      const unifiedCheckout = widgetsInstance.create(
        'payment',
        unifiedCheckoutOptions,
      );
      checkoutComponent.current = unifiedCheckout;
      unifiedCheckout.mount('#unified-checkout');
    };

    scriptTag.onload = loadHyper;
    document.body.appendChild(scriptTag);

    return () => {
      document.body.removeChild(scriptTag);
    };
  }, [theme, styles]);

  const handlePayment = useCallback(async () => {
    if (!hyper || !widgets) return;

    setIsLoading(true);

    const { error, status } = await hyper.confirmPayment({
      widgets,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/complete`,
      },
      redirect: 'if_required',
    });

    setIsLoading(false);
  }, [hyper, widgets]);

  return (
    <form id='payment-form'>
      <div id='unified-checkout'></div>
      <Button
        onClick={handlePayment}
        size='large'
        style={{ marginTop: '10px' }}
        isLoading={isLoading}
        type='submit'
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <div id='payment-message' className='hidden'></div>
    </form>
  );
};

export default HyperswitchPaymentButton;
