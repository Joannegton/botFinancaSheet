# Frontend Next.js

Aplicação responsiva para gerenciar gastos do botFinanca.

## Instalação

```bash
cd apps/web
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` no navegador.

## Variáveis de Ambiente

Crie um arquivo `.env.local` baseado em `.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Estrutura de Pastas

- `src/app/` - Páginas do Next.js
- `src/components/` - Componentes React reutilizáveis
- `src/lib/` - Lógica compartilhada, hooks, utilitários
- `src/lib/hooks/` - Hooks customizados (useAuth, useGastos)
- `src/lib/utils/` - Funções utilitárias

## Dependências Principais

- **Next.js 14** - Framework React
- **Zustand** - Gerenciamento de estado
- **TanStack Query** - Cache de requisições HTTP
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilização responsiva
- **Lucide React** - Ícones

## Features

- ✅ Autenticação com OTP via WhatsApp
- ✅ Interface responsiva (mobile-first)
- ✅ CRUD de gastos
- ✅ Dashboard com resumos
- 🔲 Relatórios (em desenvolvimento)
- 🔲 Gerenciamento de categorias (em desenvolvimento)

## Testing

```bash
npm run build
npm start
```
