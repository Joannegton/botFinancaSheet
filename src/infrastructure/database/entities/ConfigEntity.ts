import { Entity, PrimaryColumn, Column, Unique } from 'typeorm';

@Entity('configs')
@Unique(['userId'])
export class ConfigEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  userId: string;

  @Column({ type: 'integer', default: 1 })
  diaInicio: number;
}
