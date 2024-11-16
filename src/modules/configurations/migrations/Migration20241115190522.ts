import { Migration } from '@mikro-orm/migrations';

export class Migration20241115190522 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "configuration" ("id" text not null, "publishableKey" text not null, "secretKey" text not null, "paymentHashKey" text not null, "environment" text check ("environment" in (\'sandbox\', \'production\')) not null default \'sandbox\', "captureMethod" text check ("captureMethod" in (\'manual\', \'automatic\')) not null default \'automatic\', "enableSaveCards" boolean not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "configuration_pkey" primary key ("id"));');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "configuration" cascade;');
  }

}
