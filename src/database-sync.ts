/**
 * Script para sincronizar o banco de dados em produção
 * Executa antes da aplicação iniciar
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GastoEntity } from '@infrastructure/database/entities/GastoEntity';
import { CategoriaEntity } from '@infrastructure/database/entities/CategoriaEntity';
import { FormaPagamentoEntity } from '@infrastructure/database/entities/FormaPagamentoEntity';
import { ConfigEntity } from '@infrastructure/database/entities/ConfigEntity';
import { UsuarioEntity } from '@infrastructure/database/entities/UsuarioEntity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bot_financa',
  entities: [GastoEntity, CategoriaEntity, FormaPagamentoEntity, ConfigEntity, UsuarioEntity],
  synchronize: true,
  logging: true,
});

export async function syncDatabase() {
  try {
    console.log('🔄 Sincronizando banco de dados...');
    
    await AppDataSource.initialize();
    console.log('✅ Conexão com banco estabelecida');
    
    await AppDataSource.synchronize();
    console.log('✅ Banco de dados sincronizado com sucesso');
    
    await AppDataSource.destroy();
    console.log('✅ Conexão de sincronização encerrada');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar banco de dados:', error);
    process.exit(1);
  }
}

// Se for executado diretamente
if (require.main === module) {
  syncDatabase().then(() => process.exit(0));
}
