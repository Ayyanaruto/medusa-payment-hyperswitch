import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomisationSpellingUpdate1730899442665 implements MigrationInterface {
    name = 'CustomisationSpellingUpdate1730899442665'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customisation" RENAME COLUMN "appearance" TO "appearance"`);
        await queryRunner.query(`ALTER TABLE "credentials" ALTER COLUMN "environment" SET DEFAULT 'sandbox'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "credentials" ALTER COLUMN "environment" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "customisation" RENAME COLUMN "appearance" TO "appearance"`);
    }

}
