import { MedusaError } from '@medusajs/utils';
import { CredentialsRepository } from '../../repositories/credentials';
import { CredentialsType } from '../../types';
import CredentialsService from '../credentials';

describe('CredentialsService', () => {
    let credentialsService: CredentialsService;
    let credentialsRepository: jest.Mocked<typeof CredentialsRepository>;

    beforeEach(() => {
        credentialsRepository = {
            createOrUpdate: jest.fn(),
            extract: jest.fn(),
        } as any;

        credentialsService = new CredentialsService({
            credentialsRepository,
        });
    });

    describe('upsert', () => {
        it('should call createOrUpdate on the repository with the correct data', async () => {
            const data: CredentialsType = { 
                publishable_key: 'test-key', 
                secret_key: 'test-secret',
                payment_hash_key: 'test-payment-hash-key',
            };
            credentialsRepository.createOrUpdate.mockResolvedValue(data);

            const result = await credentialsService.upsert(data);

            expect(credentialsRepository.createOrUpdate).toHaveBeenCalledWith(data);
            expect(result).toEqual(data);
        });
    });

    describe('extract', () => {
        it('should throw an error if credentialsRepository_ is not defined', async () => {
            credentialsService = new CredentialsService({ credentialsRepository: undefined as any });

            await expect(credentialsService.extract()).rejects.toThrow(
                new MedusaError(
                    MedusaError.Types.NOT_FOUND,
                    'credentialsRepository_ is not defined'
                )
            );
        });

        it('should call extract on the repository and return the result', async () => {
            const data: CredentialsType = {
              publishable_key: 'test-key',
              secret_key: 'test-secret',
              payment_hash_key: 'test-payment-hash-key',
            };
            credentialsRepository.extract.mockResolvedValue(data);

            const result = await credentialsService.extract();

            expect(credentialsRepository.extract).toHaveBeenCalled();
            expect(result).toEqual(data);
        });
    });
});