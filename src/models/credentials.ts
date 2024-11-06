import { BeforeInsert, Column, Entity, PrimaryColumn, Unique } from "typeorm";
import { BaseEntity } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";

@Entity()
@Unique(["publishable_key", "secret_key"])
export class Credentials extends BaseEntity {
@PrimaryColumn({ type: "varchar",default:"" })
    publishable_key: string;
@Column({ type: "varchar",default:"" })
    secret_key: string;
@Column({ type: "varchar",default:"" })
    payment_hash_key: string;
@Column({ type: "varchar",default:"sandbox" })
    environment: string;
@Column({ type: "varchar",default:"" })    
  capture_method: string;
@Column({ type: "boolean",default:false })
    enable_save_cards: boolean;


  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, "credentials");
  }
}
