import { InferTypeOf } from "@medusajs/framework/types";
import Proxy from "../../modules/proxy/models/proxy";

export type ProxyType = InferTypeOf<typeof Proxy>;
