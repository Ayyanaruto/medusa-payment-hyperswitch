import { MedusaContainer } from "@medusajs/medusa";
import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { dataSource } from '@medusajs/medusa/dist/loaders/database';
import { Credentials } from "../models/credentials";
import { Customisation } from "../models/customisation";
import { CredentialsCreate1729574883278 } from "../migrations/1729574883278-CredentialsCreate";
import { Customisation1730564369360 } from "../migrations/1730564369360-Customisation";
import { Proxy1730691545858 } from "../migrations/1730691545858-Proxy";

export default async (
  container: MedusaContainer,
): Promise<void> => {
  try {
    const queryRunner = dataSource.createQueryRunner();


    const [credentialsExists, customisationExists, proxyExists] = await Promise.all([
      queryRunner.hasTable(Credentials.name.toLowerCase()),
      queryRunner.hasTable(Customisation.name.toLowerCase()),
      queryRunner.hasTable(Proxy.name.toLowerCase())
    ]);
  

    console.log('Checking existing tables...');
    console.log(`Credentials table exists: ${credentialsExists}`);
    console.log(`Customisation table exists: ${customisationExists}`);
    console.log(`Proxy table exists: ${proxyExists}`);

    const migrations = await dataSource.showMigrations();
    console.log('Migrations:', migrations);
  
    if (!credentialsExists || !customisationExists || !proxyExists || migrations) {
      if (migrations) {
        console.log('Running pending migrations...');
        await dataSource.runMigrations();
      }
      if (!credentialsExists) {
        console.log('Creating credentials table...');
        await new CredentialsCreate1729574883278().up(queryRunner);
      }
      if (!customisationExists) {
        console.log('Creating customisation table...');
        await new Customisation1730564369360().up(queryRunner);
      }
      if (!proxyExists) {
        console.log('Creating proxy table...');
        await new Proxy1730691545858().up(queryRunner);
      }
      try {
      await dataSource.runMigrations();
        const tables = await queryRunner.getTables([
          Credentials.name.toLowerCase(),
          Customisation.name.toLowerCase(),
          Proxy.name.toLowerCase()
        ]);

        console.log('Database schema updated. Verifying tables...');
        
        for (const table of tables) {
          console.log(`Table ${table.name} verified with columns:`, 
            table.columns.map(col => col.name).join(', ')
          );
        }

      } catch (syncError) {
        console.error('Error synchronizing database schema:', syncError);
        throw syncError;
      }
    } else {
      console.log('All required tables exist and are up to date.');
    }

    await queryRunner.release();

    console.log('Payment processor models initialization completed successfully.');

  } catch (error) {
    console.error('Error in payment processor model loader:', error);
    throw error;
  }
};
