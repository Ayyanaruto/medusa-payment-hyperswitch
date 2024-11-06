import { MedusaError } from '@medusajs/utils';
import { Proxy } from '../models/proxy';
import { ProxyTypes } from '../types';
import { dataSource } from '@medusajs/medusa/dist/loaders/database';
import Logger from '../utils/logger';

const logger = new Logger();

const createOrUpdateProxy = async function (data: ProxyTypes) {
    try {
        const [existingProxy] = await this.find();
        if (existingProxy) {
            logger.info('Updating existing proxy with ID:', existingProxy.id,"PROXY REPOSITORY");
            await this.update(
                { id: existingProxy.id },
                { ...data }
            );
            logger.info('Proxy updated successfully with data:', data);
        } else {
            logger.info('Creating a new proxy with data:', data,"PROXY REPOSITORY");
            const newProxy = this.create({ ...data });
            await this.save(newProxy);
            logger.info('New proxy created successfully with ID:', newProxy.id,"PROXY REPOSITORY");
        }
        const result = await this.findOne({
            where: { ...data }
        });
        logger.info('Proxy created/updated successfully:', result,"PROXY REPOSITORY");
        return result;
    } catch (err) {
        logger.error('Error in createOrUpdateProxy:', err,"PROXY REPOSITORY");
        throw new MedusaError(
            MedusaError.Types.DB_ERROR,
            'Error in createOrUpdateProxy'
        );
    }
}

const getProxySettings = async function () {
    try {
        const [proxy] = await this.find();
        if (!proxy) {
            logger.warn('No proxy found, returning default settings.',{
                host: '',
                port: 8080,
                username: '',
                password: '',
                url: '',
            },'PROXY REPOSITORY');
            return {
                host: '',
                port: 8080,
                username: '',
                password: '',
                url: '',
                enabled: false,
            };
        }
        logger.info('Proxy settings retrieved successfully:', proxy,"PROXY REPOSITORY");
        return proxy;
    } catch (err) {
        logger.error('Error in getProxySettings:', err,"PROXY REPOSITORY");
        throw new MedusaError(
            MedusaError.Types.DB_ERROR,
            'Error in getProxySettings'
        );
    }
}

export const ProxyRepository = dataSource
  .getRepository(Proxy)
  .extend({
    createOrUpdate: createOrUpdateProxy,
    extract: getProxySettings,
  });
