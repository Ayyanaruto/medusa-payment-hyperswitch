import { MedusaService } from "@medusajs/framework/utils";
import Proxy from "./models/proxy";
import {MedusaError} from "@medusajs/framework/utils";

import { ProxyType } from "@/src/types/models-types";
import { Logger } from "@/src/utils";

type Proxy = ProxyType;
const logger = new Logger();

class ProxyService extends MedusaService({
  Proxy
}) {
async upsert(data: Proxy): Promise<Proxy> {
  try {
    let result: ProxyType;
    const existingProxy = (await this.listProxies())[0];

    if (existingProxy) {
      result = await this.updateProxies(
        {
          id: existingProxy.id,
          ...data
        }
      );
      logger.debug("Proxy updated successfully", { result }, "PROXY_DATABASE");
    } else {
      result = await this.createProxies({
        ...data
      });
      logger.debug("Proxy created successfully", { result }, "PROXY_DATABASE");
    }

    return result;
  } catch (e) {
    logger.error("Error in upserting proxy",{
      message: e.message,
      stack: e.stack
    }, "PROXY_DATABASE");
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error in upserting proxy"
    );
  }
}

async extract(): Promise<Proxy> {
  try {
    const proxy = (await this.listProxies())[0];
    if (!proxy) {
      return {
        id: "",
        host: "",
        port: 0,
        username: "",
        password: "",
        protocol: "http",
        isActive: false,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    }
    logger.debug("Proxy extracted successfully", { proxy }, "PROXY_DATABASE");
    return proxy;
  } catch (e) {
    logger.error("Error in extracting proxy",{
      message: e.message,
      stack: e.stack
    }, "PROXY_DATABASE");
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error in extracting proxy"
    );
  }
}

}

export default ProxyService;
