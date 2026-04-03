import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('categorias')
@Unique(['nome'])
export class CategoriaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;
}
