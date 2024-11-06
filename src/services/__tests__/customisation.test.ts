import CustomisationService from '../customisation';
import { CustomisationRepository } from '../../repositories/customisation';
import { CustomisationTypes } from '../../types';

describe('CustomisationService', () => {
    let customisationService: CustomisationService;
    let customisationRepositoryMock: jest.Mocked<typeof CustomisationRepository>;

    beforeEach(() => {
        customisationRepositoryMock = {
            createOrUpdate: jest.fn(),
            extract: jest.fn(),
        } as any;

        customisationService = new CustomisationService({
            customisationRepository: customisationRepositoryMock,
        });
    });

    describe('upsert', () => {
        it('should call createOrUpdate on the repository with the provided data', async () => {
            const data: CustomisationTypes = { 
                theme: 'test-theme',
                appearance: 'test-appearance',
             };
            customisationRepositoryMock.createOrUpdate.mockResolvedValue(data);

            const result = await customisationService.upsert(data);

            expect(customisationRepositoryMock.createOrUpdate).toHaveBeenCalledWith(data);
            expect(result).toBe(data);
        });

        it('should throw an error if customisationRepository_ is not defined', async () => {
            customisationService = new CustomisationService({ customisationRepository: undefined as any });

            await expect(customisationService.upsert({} as CustomisationTypes)).rejects.toThrow(Error);
        });
    });

    describe('extract', () => {
        it('should call extract on the repository and return the result', async () => {
            const data: CustomisationTypes = {
                appearance: '',
                theme: '',
                
            };
            customisationRepositoryMock.extract.mockResolvedValue(data);

            const result = await customisationService.extract();

            expect(customisationRepositoryMock.extract).toHaveBeenCalled();
            expect(result).toBe(data);
        });

        it('should throw an error if customisationRepository_ is not defined', async () => {
            customisationService = new CustomisationService({ customisationRepository: undefined as any });

            await expect(customisationService.extract()).rejects.toThrow(Error);
        });
    });
});