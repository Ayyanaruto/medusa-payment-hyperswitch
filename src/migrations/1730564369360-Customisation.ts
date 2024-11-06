import { MigrationInterface, QueryRunner } from "typeorm";

export class Customisation1730564369360 implements MigrationInterface {
    name = 'Customisation1730564369360'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customisation" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "appearance" character varying NOT NULL, "theme" character varying NOT NULL, CONSTRAINT "PK_177922a4d5565064e098afa4c3f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "customisation"`);
    }

}
