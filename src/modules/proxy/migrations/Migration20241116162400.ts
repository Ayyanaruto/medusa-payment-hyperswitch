import { Migration } from '@mikro-orm/migrations';

export class Migration20241116162400 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "proxy" ("id" text not null, "host" text not null, "port" integer not null, "username" text not null, "password" text not null, "protocol" text check ("protocol" in (\'http\', \'https\')) not null default \'http\', "isActive" boolean not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "proxy_pkey" primary key ("id"));');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "proxy" cascade;');
  }

}
