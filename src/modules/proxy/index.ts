import { Module } from "@medusajs/framework/utils";

import ProxyService from "./service";
import proxyLoader from "./loaders/proxyLoader";

export const PROXY_MODULE = "proxyService";

export default Module(PROXY_MODULE, {
  service: ProxyService,
  loaders: [proxyLoader],
});

