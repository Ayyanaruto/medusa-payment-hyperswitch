import { InferTypeOf } from "@medusajs/framework/types";
import Configuration from "../../modules/configurations/models/configuration";

export type ConfigurationType = InferTypeOf<typeof Configuration>;
