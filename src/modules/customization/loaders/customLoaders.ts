import { LoaderOptions } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { EntityManager, MikroORM } from "@mikro-orm/postgresql";

export default async function customLoader({ container }: LoaderOptions) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const entity = container.resolve(
    ContainerRegistrationKeys.MANAGER
  ) as EntityManager;
  const orm = await MikroORM.init(entity.config);
  const em = orm.em.fork() as EntityManager;

  try {
    // Check table existence
    const checkTableExists = async (tableName: string): Promise<boolean> => {
      try {
        const knex = em.getConnection().getKnex();
        const result = await knex.schema.hasTable(tableName);
        return result;
      } catch (error) {
        logger.error(`Error checking table ${tableName}:`, error);
        return false;
      }
    };

    const customizationExists = await checkTableExists("customization");


    logger.info(`Customization table exists: ${customizationExists}`);

    const migrator = orm.migrator;
    if (!customizationExists) {
      logger.info("Running pending migrations...");
      await migrator.up();
    }
  } catch (error) {
    logger.error("An error occurred while loading configurations:", error);
    throw error;
  }
}
