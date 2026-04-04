import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UsuarioStatus {
  PENDING_CONFIRMATION = 'pending_confirmation',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

@Entity('usuarios')
@Index(['phoneNumber'])
@Index(['status'])
export class UsuarioEntity {
  @PrimaryColumn({ type: 'varchar', length: 20, name: 'phoneNumber' })
  phoneNumber: string; // Número do WhatsApp (apenas dígitos com DDI)

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'name' })
  name: string | null; // Nome do usuário fornecido no cadastro

  @Column({ type: 'enum', enum: UsuarioStatus, default: UsuarioStatus.ACTIVE, name: 'status' })
  status: UsuarioStatus;

  @CreateDateColumn({ name: 'registradoEm' })
  registradoEm: Date;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'ultimaMensagemEm' })
  ultimaMensagemEm: Date;

  @UpdateDateColumn({ name: 'atualizadoEm' })
  atualizadoEm: Date;
}
