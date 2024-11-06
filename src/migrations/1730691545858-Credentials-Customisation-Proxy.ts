import { MigrationInterface, QueryRunner } from "typeorm";

export class CredentialsCustomisationProxy1730691545858 implements MigrationInterface {
    name = 'CredentialsCustomisationProxy1730691545858'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "proxy" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "url" character varying NOT NULL DEFAULT '', "username" character varying NOT NULL DEFAULT '', "password" character varying NOT NULL DEFAULT '', "host" character varying NOT NULL DEFAULT '', "port" integer NOT NULL DEFAULT '8080', "enabled" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_581edf779fc90b8d2687c658276" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "credentials" DROP COLUMN "proxy_url"`);
        await queryRunner.query(`ALTER TABLE "customisation" ALTER COLUMN "appearance" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "customisation" ALTER COLUMN "theme" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customisation" ALTER COLUMN "theme" SET DEFAULT 'light'`);
        await queryRunner.query(`ALTER TABLE "customisation" ALTER COLUMN "appearance" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "credentials" ADD "proxy_url" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`DROP TABLE "proxy"`);
    }

}
