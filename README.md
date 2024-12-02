# Medusa-Hyperswitch Payment Integration

## Overview

This repository provides a seamless integration between Medusa, an open-source commerce platform, and Hyperswitch, a payment orchestration platform. The integration enables flexible and robust payment processing for your e-commerce application.

## Prerequisites

Before installation, ensure you have the following:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- Basic understanding of e-commerce platforms and payment integrations

## Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/Ayyanaruto/medusa-payment-hyperswitch.git
cd medusa-payment-hyperswitch
git checkout medusa-hyperswitch@v2
```

### 2. Initial Setup

Run the setup script to install dependencies and configure the project:

```bash
npm run setup
```

> **Note**: During the setup, you will be prompted to enter database credentials. Please have these ready.

This step accomplishes the following:

- Installs backend dependencies
- Configures the Medusa storefront
- Sets up Hyperswitch integration

### 3. Configure Environment Variables

Navigate to the storefront directory:

```bash
cd hyperswitch-medusa-storefront
```

Open the `.env` file and add the following credentials:

```env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_medusa_key
NEXT_PUBLIC_HYPERSWITCH_KEY=your_hyperswitch_key
```

#### Obtaining Credentials:

- **Hyperswitch Key**:
  - Log in to your Hyperswitch Dashboard
  - Navigate to Settings
  - Generate or locate your API key
- **Medusa Publishable Key**:
  - Refer to the below video
  - 

https://github.com/user-attachments/assets/3c7d7848-6ebf-4a0e-9ce0-e2eb0d0b1aaf



### 4. Start the Application

Return to the project root and start the backend:

```bash
cd ..
npm run start
```

Then, in a separate terminal, launch the storefront:

```bash
cd hyperswitch-medusa-storefront
npm run dev
```

## Troubleshooting

### Common Issues

1. **Dependency Conflicts**
   - Ensure all dependencies are correctly installed
   - Run `npm install` to resolve any missing packages
2. **Configuration Errors**
   - Double-check your `.env` file credentials
   - Verify API keys are correctly copied
   - Ensure no extra spaces or characters are present
3. **Runtime Errors**
   - Check console output for specific error messages
   - Verify Node.js and npm versions meet the requirements

## Documentation and Support

- [Medusa Documentation](https://docs.medusajs.com/)
- [Hyperswitch Documentation](https://docs.hyperswitch.io/)
- [Project Repository](https://github.com/Ayyanaruto/medusa-payment-hyperswitch)
