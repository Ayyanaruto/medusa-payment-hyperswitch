import { Module } from "@medusajs/framework/utils";
import CustomizationService from "./service";
import customLoader from "./loaders/customLoaders";

export const CUSTOMIZATION_MODULE = "customizationService";

export default Module(CUSTOMIZATION_MODULE, {
  service: CustomizationService,
  loaders: [customLoader],
});

