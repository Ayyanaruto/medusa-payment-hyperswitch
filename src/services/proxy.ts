import { TransactionBaseService } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';
import { Proxy } from '../models/proxy';
import { ProxyRepository } from '../repositories/proxy';
import { ProxyTypes } from '../types';


class ProxyService extends TransactionBaseService {
    protected proxyRepository_: typeof ProxyRepository;
    constructor(container: {
        proxyRepository: typeof ProxyRepository;
    }) {
        super(container);
        this.proxyRepository_ = container.proxyRepository;
    }
    async upsert(data: ProxyTypes): Promise<ProxyTypes> {
        if (!this.proxyRepository_) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                'proxyRepository_ is not defined',
            );
        }
      
        return await this.proxyRepository_.createOrUpdate(data);
    }
    async extract(): Promise<ProxyTypes | {}> {
        if (!this.proxyRepository_) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                'proxyRepository_ is not defined',
            );
        }
        return await this.proxyRepository_.extract();
    }

}

export default ProxyService;