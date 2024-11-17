import { Migration } from '@mikro-orm/migrations';

export class Migration20241117014930 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "customization" ("id" text not null, "theme" text not null, "styles" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "customization_pkey" primary key ("id"));');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "customization" cascade;');
  }

}
