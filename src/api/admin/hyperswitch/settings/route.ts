import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import CredentialsService from "../../../../services/credentials";
import { MedusaError } from "@medusajs/utils";


export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const credentialsService: CredentialsService = req.scope.resolve(
      "credentialsService"
    );
    res.json({
      credentials: await credentialsService.extract(),
      
    });
  }
  catch(e){
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error extracting credentials"
    );
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
 try {
   const credentialsService: CredentialsService =
     req.scope.resolve("credentialsService");
    const data = req.body;
    await credentialsService.upsert(data as any);
   res.json({
     message: "Succesfully updated the credentials!",
   });
 } catch (e) {
   throw new MedusaError(
     MedusaError.Types.DB_ERROR,
      "Error updating credentials"
   );
 }
};
