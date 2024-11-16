import { model } from "@medusajs/framework/utils";

const Proxy = model.define("proxy",{
    id:model.id().primaryKey(),
    host:model.text(),
    port:model.number(),
    username:model.text(),
    password:model.text(),
    protocol:model.enum(["http","https"]).default("http"),
    isActive:model.boolean()
})
export default Proxy;
