import { MigrationInterface, QueryRunner } from "typeorm";

export class CredentialsCreate1729574883278 implements MigrationInterface {
    name = 'CredentialsCreate1729574883278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "credentials" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "publishable_key" character varying NOT NULL, "secret_key" character varying NOT NULL, "payment_hash_key" character varying NOT NULL,"environment" character varying NOT NULL DEFAULT 'sandbox', "capture_method" character varying NOT NULL, "enable_save_cards" boolean NOT NULL, CONSTRAINT "UQ_ad0d693bfc5d991dee9bb128f81" UNIQUE ("publishable_key", "secret_key"), CONSTRAINT "PK_a191b8093f488e563cdf0dfc2e6" PRIMARY KEY ("id", "publishable_key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "credentials"`);
    }

}
