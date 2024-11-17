import { InferTypeOf } from "@medusajs/framework/types";
import Customization from "../../modules/customization/models/customization";

export type CustomizationType = InferTypeOf<typeof Customization>;
