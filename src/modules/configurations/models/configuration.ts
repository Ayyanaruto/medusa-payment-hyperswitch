import { model } from "@medusajs/framework/utils";

const Configuration = model.define("configuration",{
id:model.id().primaryKey(),
publishableKey:model.text(),
secretKey:model.text(),
paymentHashKey:model.text(),
profileId:model.text(),
environment:model.enum(["sandbox","production"]).default("sandbox"),
captureMethod:model.enum(["manual","automatic"]).default("automatic"),
enableSaveCards:model.boolean()
})
export default Configuration;
