import { CustomisationRepository } from '../repositories/customisation';
import { MedusaError } from '@medusajs/utils';
import { CustomisationTypes } from '../types';
import { TransactionBaseService } from '@medusajs/medusa';

class CustomisationService extends TransactionBaseService {
  protected customisationRepository_: typeof CustomisationRepository;

  constructor(container: {
    customisationRepository: typeof CustomisationRepository;
  }) {
    super(container);
    this.customisationRepository_ = container.customisationRepository;
  }

  async upsert(data: CustomisationTypes): Promise<CustomisationTypes> {
    if (!this.customisationRepository_) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'customisationRepository_ is not defined',
      );
    }
    return await this.customisationRepository_.createOrUpdate(data);
  }

  async extract(): Promise<CustomisationTypes | {}> {
    if (!this.customisationRepository_) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'customisationRepository_ is not defined',
      );
    }
    return await this.customisationRepository_.extract();
  }
}

export default CustomisationService;
