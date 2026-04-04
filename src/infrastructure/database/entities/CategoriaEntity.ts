import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

@Entity('categorias')
@Unique(['userId', 'nome'])
@Index(['userId'])
export class CategoriaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  userId: string; // Número do WhatsApp (referencias UsuarioEntity)

  @Column({ type: 'varchar', length: 100 })
  nome: string;
}
