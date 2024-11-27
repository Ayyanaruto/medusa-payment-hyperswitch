import HyperswitchPaymentProvider from "./service";
import { Modules,ModuleProvider, Module } from "@medusajs/framework/utils";
export default ModuleProvider(Modules.PAYMENT,{
  services: [HyperswitchPaymentProvider]
})

