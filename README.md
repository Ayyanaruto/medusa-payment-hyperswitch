# Medusa Payment Hyperswitch v2

Welcome to the **Medusa Payment Hyperswitch v2** documentation! 🎉 This README is your treasure map to the project, setup instructions, and usage guidelines. Let's dive in!

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction
**Medusa Payment Hyperswitch v2** is your magical wand for payment processing! 🪄 It effortlessly integrates various payment gateways into your application, making transactions smoother than butter.

## Features
- 🛠️ Easy integration with multiple payment gateways
- 🔒 Secure and reliable transaction processing
- 💳 Support for various payment methods
- 📊 Detailed transaction logging and reporting

## Installation
To install **Medusa Payment Hyperswitch v2**, cast the following spell in your terminal:

```bash
npm install medusa-payment-hyperswitch@v2
```

## Usage
Here's a spellbook entry on how to use **Medusa Payment Hyperswitch v2** in your project:

```javascript
const Hyperswitch = require('medusa-payment-hyperswitch');

const hyperswitch = new Hyperswitch({
  apiKey: 'your-api-key',
  environment: 'sandbox', // or 'production'
});

hyperswitch.processPayment({
  amount: 1000,
  currency: 'USD',
  paymentMethod: 'credit_card',
  cardDetails: {
    number: '4111111111111111',
    expiryMonth: '12',
    expiryYear: '2023',
    cvv: '123',
  },
}).then(response => {
  console.log('✨ Payment successful:', response);
}).catch(error => {
  console.error('💥 Payment failed:', error);
});
```

## Contributing
We love contributions! ❤️ Check out our [contributing guidelines](CONTRIBUTING.md) to join the fun and help make **Medusa Payment Hyperswitch v2** even more magical.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for all the legal mumbo jumbo.
