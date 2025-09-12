# 🐷 Templates de Email do por.quinho

Templates personalizados para emails de autenticação do Supabase com design moderno e temático.

## ✨ Características

- 🎨 **Design moderno**: Layout responsivo com CSS Grid e Flexbox
- 🐷 **Tema por.quinho**: Cores rosa/pink (#EC4899) e ícones de porquinho
- 📱 **Mobile-first**: Otimizado para dispositivos móveis
- 🔒 **Avisos de segurança**: Informações claras sobre expiração e segurança
- 💌 **Tipografia moderna**: Google Fonts (Inter) para melhor legibilidade
- 🌟 **Micro-interações**: Botões com hover effects e gradientes

## 📧 Templates Incluídos

### 1. **Confirmação de Cadastro**

- **Assunto**: `🐷 Confirme seu cadastro no por.quinho`
- **Uso**: Quando usuário se registra
- **Expiração**: 24 horas

### 2. **Magic Link**

- **Assunto**: `🚀 Seu acesso rápido ao por.quinho`
- **Uso**: Login sem senha
- **Expiração**: 1 hora

### 3. **Recuperação de Senha**

- **Assunto**: `🔑 Redefinir senha - por.quinho`
- **Uso**: Reset de senha esquecida
- **Expiração**: 1 hora

### 4. **Convite de Usuário**

- **Assunto**: `🎉 Você foi convidado para o por.quinho!`
- **Uso**: Convites para novos usuários
- **Sem expiração específica**

### 5. **Mudança de Email**

- **Assunto**: `📧 Confirme seu novo email - por.quinho`
- **Uso**: Confirmação de novo email
- **Expiração**: 24 horas

## 🚀 Como Usar

### Opção 1: Script Automático (Recomendado)

```bash
# 1. Configure as variáveis de ambiente
export SUPABASE_ACCESS_TOKEN="seu-access-token"
export PROJECT_REF="seu-project-ref"

# 2. Execute o script completo
./update-supabase-email-templates.sh
```

### Opção 2: Script Simples

```bash
# 1. Configure as variáveis
export SUPABASE_ACCESS_TOKEN="seu-access-token"
export PROJECT_REF="seu-project-ref"

# 2. Execute o comando simples
./update-email-templates-simple.sh
```

### Opção 3: Comando Manual

```bash
# Defina suas credenciais
export SUPABASE_ACCESS_TOKEN="seu-access-token"
export PROJECT_REF="seu-project-ref"

# Execute o comando curl
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @email-templates-config.json
```

## 🔑 Obtendo Credenciais

### 1. **SUPABASE_ACCESS_TOKEN**

- Acesse: https://supabase.com/dashboard/account/tokens
- Clique em "Generate new token"
- Copie o token gerado

### 2. **PROJECT_REF**

- Acesse seu projeto no Supabase Dashboard
- Copie o "Project Reference" da URL
- Formato: `https://supabase.com/dashboard/project/[PROJECT_REF]`

## 📁 Arquivos Incluídos

```
├── supabase-email-templates.js         # Templates em JavaScript
├── update-supabase-email-templates.sh  # Script completo com validações
├── update-email-templates-simple.sh    # Script simples
└── EMAIL-TEMPLATES-README.md          # Esta documentação
```

## 🎨 Paleta de Cores

```css
/* Cores principais */
--primary: #ec4899; /* Rosa principal */
--primary-dark: #be185d; /* Rosa escuro */
--background: #fdf2f8; /* Rosa claro fundo */
--border: #fce7f3; /* Rosa borda */

/* Gradientes */
background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
```

## 🔧 Customização

Para personalizar os templates:

1. **Edite o arquivo** `supabase-email-templates.js`
2. **Modifique as cores** no CSS de cada template
3. **Atualize o conteúdo** das mensagens
4. **Execute novamente** o script de atualização

### Exemplo de personalização:

```css
/* Mudar cor principal */
.header {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
}

/* Mudar cor dos botões */
.btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
```

## 🛠️ Desenvolvimento

### Estrutura do Template

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Título do Email</title>
    <style>
      /* CSS minificado */
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="header"><!-- Cabeçalho --></div>
        <div class="body"><!-- Conteúdo --></div>
        <div class="footer"><!-- Rodapé --></div>
      </div>
    </div>
  </body>
</html>
```

### Variáveis do Supabase

Os templates usam as seguintes variáveis:

- `{{ .ConfirmationURL }}` - URL de confirmação/ação
- `{{ .SiteURL }}` - URL do seu site
- `{{ .Token }}` - Token de autenticação (se necessário)

## 📱 Compatibilidade

✅ **Clientes de Email Testados:**

- Gmail (Desktop/Mobile)
- Outlook (Desktop/Mobile)
- Apple Mail (Desktop/Mobile)
- Yahoo Mail
- Thunderbird

✅ **Dispositivos:**

- iPhone/iPad
- Android
- Desktop (Windows/Mac/Linux)

## 🐛 Troubleshooting

### Erro: "Unauthorized"

- Verifique se o `SUPABASE_ACCESS_TOKEN` está correto
- Confirme se o token tem permissões de administrador

### Erro: "Project not found"

- Verifique se o `PROJECT_REF` está correto
- Confirme se você tem acesso ao projeto

### Templates não aparecem

- Aguarde alguns minutos para propagação
- Teste enviando um email de confirmação
- Verifique nos logs do Supabase

## 🎯 Próximos Passos

1. **Teste os templates** enviando emails de cada tipo
2. **Ajuste as cores** se necessário para sua marca
3. **Configure domínio personalizado** no Supabase
4. **Monitore métricas** de abertura e clique dos emails

## 🐷 Conceito

Todos os templates seguem o conceito **"De pouco em pouco se enche o porquinho"**, incentivando os usuários a economizar e cuidar bem de suas finanças de forma gradual e consistente.

---

**© 2024 por.quinho - De pouco em pouco se enche o porquinho** 🐷💰
