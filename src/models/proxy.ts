import { BeforeInsert, Column, Entity } from 'typeorm';
import { BaseEntity } from '@medusajs/medusa';
import { generateEntityId } from '@medusajs/medusa/dist/utils';

@Entity()
export class Proxy extends BaseEntity {
    @Column({ type: 'varchar', default: '' })
    url: string;

    @Column({ type: 'varchar', default: '' })
    username: string;

    @Column({ type: 'varchar', default: '' })
    password: string;

    @Column({ type: 'varchar', default: '' })
    host: string;

    @Column({ type: 'int', default: 8080 })
    port: number;

    @Column({ type: 'bool', default: false })
    enabled: boolean;

    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, 'credentials');
    }
}
