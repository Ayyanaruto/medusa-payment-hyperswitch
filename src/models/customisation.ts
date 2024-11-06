import { BeforeInsert, Column, Entity, PrimaryColumn, Unique } from "typeorm";
import { BaseEntity } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";

@Entity()
export class Customisation extends BaseEntity {
    @Column({ type: "varchar" })
    appearance: string;
    @Column({ type: "varchar" })
    theme: string;
    @PrimaryColumn({ type: "varchar" })
    id: string;


 @BeforeInsert()
  private beforeInsertHandler(): void {
    this.id = generateEntityId(this.id, "customisation");
  }
}