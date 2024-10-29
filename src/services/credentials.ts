import { TransactionBaseService } from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import { CredentialsRepository } from "../repositories/credentials";
import { CredentialsType } from "../types";

class CredentialsService extends TransactionBaseService {
  protected credentialsRepository_: typeof CredentialsRepository;

  constructor(container: { credentialsRepository: typeof CredentialsRepository }) {
    super(container);
    this.credentialsRepository_ = container.credentialsRepository;
  }

  async upsert(data: CredentialsType): Promise<CredentialsType> {
    return await this.credentialsRepository_.createOrUpdate(data);
  }

  async extract(): Promise<CredentialsType | {}> {
    if (!this.credentialsRepository_) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "credentialsRepository_ is not defined"
      );
    }
    return await this.credentialsRepository_.extract();
  }
}

export default CredentialsService;
