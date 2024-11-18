import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "./src/modules/configurations",
    },
    {
      resolve: "./src/modules/proxy",
    },
    {
      resolve: "./src/modules/customization",
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            id: "hyperswitch",
            resolve: "./src/modules/hyperswitch",
          }
        ]
      },
    },
  ],
});
