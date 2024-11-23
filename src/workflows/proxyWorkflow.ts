import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import proxy, { PROXY_MODULE } from "@/src/modules/proxy";
import ProxyService from "@/src/modules/proxy/service";
import { ProxyType } from "@/src/types/models-types";

const step1 = createStep("step-1", async (_, { container }): Promise<StepResponse<ProxyType>> => {
  const proxy: ProxyService = container.resolve(PROXY_MODULE);
  const config = await proxy.extract();
  return new StepResponse(config);
});

const proxyWorkflow = createWorkflow("proxy-workflow",()=>{
let config=step1();
return new WorkflowResponse(config);
}
);

export default proxyWorkflow;
