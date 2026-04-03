import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('gastos')
export class GastoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp with time zone' })
  dataHora: Date;

  @Column({ type: 'varchar', length: 100 })
  formaPagamento: string;

  @Column({ type: 'varchar', length: 100 })
  tipo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ type: 'text', nullable: true })
  observacao: string;

  @CreateDateColumn()
  criadoEm: Date;
}
