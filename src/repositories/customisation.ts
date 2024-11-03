import { MedusaError } from '@medusajs/utils';
import { Customisation } from '../models/customisation';
import { CustomisationTypes } from '../types';
import { dataSource } from '@medusajs/medusa/dist/loaders/database';
import Logger from '../utils/logger';
import path from 'path';

const logger = new Logger();

const createOrUpdateCustomisation = async function (data: CustomisationTypes) {
  logger.info(
    'Inside createOrUpdateCustomisation',
    data,
    'CUSTOMISATION SETTINGS REPOSITORY',
  );
  try {
    const [existingCustomisation] = await this.find();
    logger.info('Existing Customisation', existingCustomisation);

    if (existingCustomisation) {
      logger.info(
        'Updating Customisation',
        existingCustomisation,
        'CUSTOMISATION SETTINGS REPOSITORY',
      );
      await this.update(
        { id: existingCustomisation.id },
        {
          appearence: JSON.stringify(data.appearance),
          theme: data.theme,
        },
      );
      logger.info(
        'Updated Customisation',
        data,
        'CUSTOMISATION SETTINGS REPOSITORY',
      );
    } else {
      logger.info(
        'Creating new Customisation',
        data,
        'CUSTOMISATION SETTINGS REPOSITORY',
      );
      const newCustomisation = this.create({
        appearence: JSON.stringify(data.appearance),
        theme: data.theme,
      });
      await this.save(newCustomisation);
      logger.info(
        'Created Customisation',
        newCustomisation,
        'CUSTOMISATION SETTINGS REPOSITORY',
      );
    }

    const result = await this.findOne({
      where: {
        appearence: JSON.stringify(data.appearance),
        theme: data.theme,
      },
    });

    logger.info(
      'Created/Updated Customisation',
      result,
      'CUSTOMISATION SETTINGS REPOSITORY',
    );
    return result;
  } catch (e) {
    logger.error(
      'Error in Customisation Creation/Update',
      e,
      path.basename(__filename),
    );
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      'Error in createOrUpdate',
    );
  }
};

const findCustomisation = async function () {
  try {
    const [customisation] = await this.find();
    logger.info(
      'Found Customisation',
      customisation,
      'CUSTOMISATION SETTINGS REPOSITORY',
    );
    return customisation;
  } catch (e) {
    logger.error(
      'Error in Customisation Find',
      e,
      'CUSTOMISATION SETTINGS REPOSITORY',
    );
    throw new MedusaError(MedusaError.Types.DB_ERROR, 'Error in find');
  }
};

export const CustomisationRepository = dataSource
  .getRepository(Customisation)
  .extend({
    createOrUpdate: createOrUpdateCustomisation,
    extract: findCustomisation,
  });
