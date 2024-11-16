import { Module } from "@medusajs/framework/utils";

import ProxyService from "./service";

export const PROXY_MODULE = "proxyService";

export default Module(PROXY_MODULE, {
  service: ProxyService,
});

