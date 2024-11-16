import ConfigurationService from "./service";
import { Module } from "@medusajs/framework/utils";

export const CONFIG_MODULE = "configurationsService";

export default Module(CONFIG_MODULE, {
  service: ConfigurationService,
});
