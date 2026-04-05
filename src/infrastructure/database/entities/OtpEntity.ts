import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('otps')
@Index(['phoneNumber'])
@Index(['codigoUtilizado'])
export class OtpEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, name: 'phoneNumber' })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 6, name: 'codigo' })
  codigo: string;

  @Column({ type: 'timestamp with time zone', name: 'expiradoEm' })
  expiradoEm: Date;

  @Column({ type: 'boolean', default: false, name: 'codigoUtilizado' })
  codigoUtilizado: boolean;

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;
}
