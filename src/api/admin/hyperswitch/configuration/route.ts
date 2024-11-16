import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";


import { ConfigurationType } from "../../../../types/models-types";




export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  try {
    const configurationsService = req.scope.resolve("configurationsService") as { extract: () => Promise<ConfigurationType> };
    const configurations = await configurationsService.extract();
    res.status(200).json({ configurations });
  }
  catch (error) {
    console.log(error);
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error in extracting configuration"
    );
  }
};

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
const configurationsService = req.scope.resolve("configurationsService") as { upsert: (data: ConfigurationType) => Promise<ConfigurationType> };
  const data = req.body;
  try {
    const configuration = await configurationsService.upsert(data as ConfigurationType);
    console.log("configuration", configuration);
    res.status(200).json({ configuration });
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error in upserting configuration"
    );
  }
};
