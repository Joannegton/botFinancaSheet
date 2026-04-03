import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('formas_pagamento')
@Unique(['nome'])
export class FormaPagamentoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;
}
