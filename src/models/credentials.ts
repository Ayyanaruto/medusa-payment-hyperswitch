import { BeforeInsert, Column, Entity, PrimaryColumn, Unique } from "typeorm";
import { BaseEntity } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";

@Entity()
@Unique(["publishable_key", "secret_key"])
export class Credentials extends BaseEntity {
@PrimaryColumn({ type: "varchar" })
    publishable_key: string;
@Column({ type: "varchar" })
    secret_key: string;
@Column({ type: "varchar" })
    payment_hash_key: string;
@Column({ type: "varchar" })
    webhook_url: string;
@Column({ type: "varchar" })
    environment: string;
@Column({ type: "varchar" })    
  capture_method: string;
@Column({ type: "boolean" })
    enable_save_cards: boolean;
@Column({ type: "varchar" })
    appearence: string;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, "credentials");
  }
}
