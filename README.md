# 🚀 Hyperswitch Medusa Plugin
> Transform your Medusa store with seamless payment processing using Hyperswitch! 

[![Made with Medusa](https://img.shields.io/badge/Made%20with-Medusa-6366F1.svg)](https://medusajs.com)
[![Powered by Hyperswitch](https://img.shields.io/badge/Powered%20by-Hyperswitch-1d4ed8.svg)](https://hyperswitch.io)

## 📑 Table of Contents
- [Installation](#installation)
  - [Medusa Backend Setup](#medusa-backend-setup)
  - [Hyperswitch Plugin Setup](#hyperswitch-plugin-setup)
- [Video Installation Guide](#video-installation-guide)
- [Usage](#usage)

## 🛠 Installation

### Medusa Backend Setup

#### Prerequisites
- Node.js (version 16 or higher)
- PostgreSQL
- Git

#### Step-by-Step Guide

1. **Clone the starter repository**
   ```bash
   git clone https://github.com/medusajs/medusa-starter-default.git
   cd medusa-starter-default
   ```

2. **Switch to v1 branch**
   ```bash
   git checkout v1
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.template .env
   ```

5. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE "your_database_name";
   ```

6. **Configure database connection**
   Add to your `.env` file:
   ```bash
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<your_database_name>
   ```

7. **Run migrations**
   ```bash
   npx medusa migrations run
   ```

8. **Seed the database**
   ```bash
   yarn seed
   ```

9. **Start the development server**
   ```bash
   npm run dev
   ```

> 💡 **Default Admin Credentials**  
> Email: `admin@medusa-test.com`  
> Password: `supersecret`

To create a new admin user:
```bash
npx medusa user -e your@email.com -p your-password
```

### Hyperswitch Plugin Setup

1. **Install the plugin**
   ```bash
   npm install medusa-payment-hyperswitch
   ```

2. **Update medusa-config.js**
   ```javascript
   {
     resolve: "medusa-payment-hyperswitch",
     options: {
       enableUI: true,
     }
   }
   ```

3. **Add encryption key**
   Add to your `.env` file:
   ```bash
   HYPERSWITCH_SECRET_KEY=GvcUS5KMlC/3ND1eCXx4n4VEosUwblX5kcJ4gKkumiw=
   ```
   > ⚠️ Make sure to use a secure 256-bit key for encryption in production!

4. **Build the project**
   ```bash
   npm run build
   ```

## 🎥 Video Installation Guides

### Backend Installation Tutorial
Watch our detailed guide for setting up the Medusa backend:

[![Medusa Backend Installation](https://img.shields.io/badge/Watch%20Backend%20Tutorial-red?style=for-the-badge&logo=youtube)](https://youtu.be/Qf1svoZguy0)

Key topics covered:
- Repository cloning & setup
- Environment configuration
- Database initialization
- Running migrations and seeding data

### Plugin Installation Tutorial
Learn how to integrate the Hyperswitch plugin:

[![Hyperswitch Plugin Installation](https://img.shields.io/badge/Watch%20Plugin%20Tutorial-red?style=for-the-badge&logo=youtube)](https://youtu.be/tu_ekb1g_c0)

Key topics covered:
- Plugin installation steps
- Configuration in medusa-config.js
- Setting up encryption keys
- Testing the integration

## 🎮 Usage

![gif](https://github.com/user-attachments/assets/f9b1f16c-7fac-4bb8-b500-c28fd43fef77)


Once installed, you can access the Hyperswitch payment options in your Medusa admin panel:
1. Navigate to Settings → Regions
2. Configure Edit Region Details
3. Select Payment Processors as Hyperswitch
4. Navigate to Settings → Payments
5. Configure your Hyperswitch credentials

## 🛒🛍️ Hyperswitch integrated Storefront
1. **Clone the storefront repository**
   ```bash
   git clone https://github.com/Ayyanaruto/hyperswitch-medusa-storefront.git
   cd hyperswitch-medusa-storefront
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure your `.env` file**
     Add to your `.env` file:
      ```
      #Your Medusa backend, should be updated to where you are hosting your server. Remember to update CORS settings for your server
      NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
      
      #Your store URL, should be updated to where you are hosting your storefront.
      NEXT_PUBLIC_BASE_URL=http://localhost:8000
      
      #Your preferred default region. When middleware cannot determine the user region from the "x-vercel-country" header, the default region will be used. ISO-2 lowercase format. 
      NEXT_PUBLIC_DEFAULT_REGION=us
      
      #Your hyperswitch Public Key
      NEXT_PUBLIC_HYPERSWITCH_KEY= pk_******
      
      # Your Next.js revalidation secret. See – https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#on-demand-revalidation
      REVALIDATE_SECRET=supersecret
      ```
  4. **Start the development server**
       ```bash
       npm run start
       ```

<p align="center">
  Made with ❤️ by Ayyan Shaikh
</p>
