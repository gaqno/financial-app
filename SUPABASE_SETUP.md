# 🚀 Configuração do Supabase

## ✅ Banco de Dados Configurado

O banco de dados foi criado com sucesso! As seguintes tabelas foram criadas:

### 📋 Tabelas

1. **`profiles`** - Perfis de usuário

   - Extensão da tabela `auth.users`
   - RLS habilitado
   - Criado automaticamente no signup

2. **`finance_records`** - Registros financeiros

   - Todos os campos do `IFinanceRecord`
   - Relacionamento com `profiles`
   - RLS habilitado

3. **`investments`** - Investimentos

   - Todos os campos do `IInvestment`
   - Relacionamento com `profiles`
   - RLS habilitado

4. **`user_settings`** - Configurações do usuário
   - Meses ocultos, filtros, projeções
   - Relacionamento com `profiles`
   - RLS habilitado

### 🔐 Segurança Configurada

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas de segurança** que garantem que usuários só acessem seus próprios dados
- **Triggers automáticos** para criar perfil e configurações no signup
- **Índices otimizados** para melhor performance

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

\`\`\`env

# Supabase Configuration

VITE_SUPABASE_URL=https://fjvuhozcxydgtoamahwy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdnVob3pjeHlkZ3RvYW1haHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTM5NzQsImV4cCI6MjA3MzA4OTk3NH0.w9PvDFcGBrGoLz6aANm5HBCyU_nsrqmHMgYHFv1uDM4

# Development Environment

NODE_ENV=development
\`\`\`

## 🧪 Testar a Autenticação

1. **Inicie o projeto:**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Teste o registro:**

   - Abra a aplicação
   - Clique em "Não tem uma conta? Registrar-se"
   - Preencha os dados
   - Confirme o email se necessário

3. **Teste o login:**
   - Use as credenciais criadas
   - Ou use as credenciais demo (se em desenvolvimento)

## 📊 Dashboard do Supabase

Acesse: https://supabase.com/dashboard/project/fjvuhozcxydgtoamahwy

- **Authentication**: Ver usuários registrados
- **Table Editor**: Ver dados das tabelas
- **SQL Editor**: Executar queries
- **Logs**: Monitorar atividade

## 🔧 Próximos Passos

1. ✅ Configurar variáveis de ambiente
2. ⏳ Migrar financeStore para usar Supabase
3. ⏳ Implementar sincronização offline/online
4. ⏳ Testar todas as funcionalidades

## 🆘 Troubleshooting

### Erro "Supabase não configurado"

- Verifique se o arquivo `.env` existe
- Verifique se as variáveis estão corretas
- Reinicie o servidor de desenvolvimento

### Erro de autenticação

- Verifique se o usuário foi criado
- Confirme o email se necessário
- Verifique as políticas RLS no dashboard

### Erro de permissão

- Verifique se o RLS está habilitado
- Verifique se as políticas estão corretas
- Verifique se `auth.uid()` está retornando valor
