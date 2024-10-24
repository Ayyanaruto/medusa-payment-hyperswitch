
import { TransactionBaseService } from "@medusajs/medusa"
import { CredentialsRepository } from "../repositories/credentials";

import { CredentialsType } from "../types";


class CredentialsService extends TransactionBaseService {

  protected credentialsRepository_: typeof CredentialsRepository;

  constructor(container) {
    super(container);

    this.credentialsRepository_ = container.credentialsRepository;
    
  }
  async upsert(data: CredentialsType) {
    const res = await this.credentialsRepository_.createOrUpdate(data);
    return res;
  }

  async extract() {
   return await this.credentialsRepository_.extract();
  }

  }

  export default CredentialsService;

 
