import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { CUSTOMIZATION_MODULE } from "@/src/modules/customization";
import ConfigurationService from "@/src/modules/customization/service";
import {CustomizationType } from "@/src/types/models-types";

const step1 = createStep("step-1", async (_, { container }): Promise<StepResponse<CustomizationType>> => {
  const customizations: ConfigurationService = container.resolve(CUSTOMIZATION_MODULE);
  const config = await customizations.extract();
  return new StepResponse(config);
}
);

const customWorkflow = createWorkflow("customizations-workflow",()=>{
let config=step1();
return new WorkflowResponse(config);
}
);

export default customWorkflow;
