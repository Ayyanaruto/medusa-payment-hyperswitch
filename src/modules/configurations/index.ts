import { Module } from "@medusajs/framework/utils";
import ConfigurationService from "./service";

export const CONFIG_MODULE = "configurationsService";

export default Module(CONFIG_MODULE, {
  service: ConfigurationService,
});
