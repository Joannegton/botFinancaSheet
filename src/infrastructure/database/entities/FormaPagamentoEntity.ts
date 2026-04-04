import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

@Entity('formas_pagamento')
@Unique(['userId', 'nome'])
@Index(['userId'])
export class FormaPagamentoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  userId: string; // Número do WhatsApp (references UsuarioEntity)

  @Column({ type: 'varchar', length: 100 })
  nome: string;
}
