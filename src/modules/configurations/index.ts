import { Module } from "@medusajs/framework/utils";
import ConfigurationService from "./service";
import configLoader from "./loaders/configurationLoader";

export const CONFIG_MODULE = "configurationsService";

export default Module(CONFIG_MODULE, {
  service: ConfigurationService,
  loaders: [configLoader],
});
