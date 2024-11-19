import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { CONFIG_MODULE } from "../modules/configurations";
import ConfigurationService from "../modules/configurations/service";
import { ConfigurationType } from "src/types/models-types";


const step1 = createStep("step-1", async (_, { container }): Promise<StepResponse<ConfigurationType>> => {
  const configurations: ConfigurationService = container.resolve(CONFIG_MODULE);
  const config = await configurations.extract();
  return new StepResponse(config);
});

const configWorkflow = createWorkflow("configurations-workflow",()=>{
let config=step1();
return new WorkflowResponse(config);
});

export default configWorkflow;




