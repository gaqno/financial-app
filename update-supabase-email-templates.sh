#!/bin/bash

# 🐷 Script para atualizar templates de email do por.quinho no Supabase
# Uso: ./update-supabase-email-templates.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "🐷 ============================================="
echo "   por.quinho - Email Templates Updater"
echo "   De pouco em pouco se enche o porquinho"
echo "=============================================${NC}"
echo

# Verificar variáveis de ambiente
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ Erro: SUPABASE_ACCESS_TOKEN não definido${NC}"
    echo -e "${YELLOW}📝 Como obter:${NC}"
    echo "   1. Acesse: https://supabase.com/dashboard/account/tokens"
    echo "   2. Gere um novo token"
    echo "   3. Execute: export SUPABASE_ACCESS_TOKEN=\"seu-token\""
    echo
    exit 1
fi

if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}❌ Erro: PROJECT_REF não definido${NC}"
    echo -e "${YELLOW}📝 Como obter:${NC}"
    echo "   1. Acesse seu projeto no Supabase Dashboard"
    echo "   2. Copie o Project Reference da URL"
    echo "   3. Execute: export PROJECT_REF=\"seu-project-ref\""
    echo
    exit 1
fi

echo -e "${BLUE}🔍 Verificando configurações atuais...${NC}"

# Backup da configuração atual
echo -e "${YELLOW}💾 Fazendo backup da configuração atual...${NC}"
curl -s -X GET "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  | jq 'to_entries | map(select(.key | startswith("mailer"))) | from_entries' \
  > "email-templates-backup-$(date +%Y%m%d-%H%M%S).json"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup salvo com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao fazer backup. Verifique suas credenciais.${NC}"
    exit 1
fi

echo
echo -e "${BLUE}🚀 Atualizando templates de email...${NC}"

# Templates otimizados com design responsivo
CONFIRMATION_TEMPLATE='<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirme seu cadastro - por.quinho</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
body{margin:0;padding:0;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background-color:#fdf2f8;line-height:1.6}
.container{max-width:600px;margin:0 auto;padding:20px;background-color:#fdf2f8}
.card{background-color:#fff;border-radius:16px;box-shadow:0 10px 25px rgba(236,72,153,0.1);overflow:hidden;border:1px solid #fce7f3}
.header{background:linear-gradient(135deg,#ec4899 0%,#be185d 100%);padding:40px 30px;text-align:center;color:#fff}
.header h1{margin:0;font-size:28px;font-weight:700;margin-bottom:8px}
.tagline{margin:0;font-size:14px;opacity:0.9;font-style:italic;font-weight:300}
.body{padding:40px 30px}
.body h2{color:#be185d;font-size:24px;font-weight:600;margin:0 0 20px 0;text-align:center}
.body p{color:#374151;font-size:16px;margin:0 0 20px 0;text-align:center}
.btn{display:block;background:linear-gradient(135deg,#ec4899 0%,#be185d 100%);color:#fff!important;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;text-align:center;margin:20px auto;width:fit-content;box-shadow:0 4px 12px rgba(236,72,153,0.3)}
.note{background-color:#fef3cd;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:20px 0}
.note p{color:#92400e;font-size:14px;margin:0;text-align:left}
.footer{background-color:#f9fafb;padding:30px;text-align:center;border-top:1px solid #f3f4f6}
.footer p{color:#6b7280;font-size:14px;margin:0}
@media only screen and (max-width:600px){.container{padding:10px}.header{padding:30px 20px}.body{padding:30px 20px}.footer{padding:20px}.header h1{font-size:24px}.body h2{font-size:20px}}
</style>
</head>
<body>
<div class="container">
<div class="card">
<div class="header">
<h1>🐷 Bem-vindo ao por.quinho!</h1>
<p class="tagline">De pouco em pouco se enche o porquinho</p>
</div>
<div class="body">
<h2>Confirme seu cadastro</h2>
<p>Estamos muito felizes em ter você conosco! 🎉</p>
<p>Para começar sua jornada rumo à independência financeira, precisamos confirmar seu email.</p>
<a href="{{ .ConfirmationURL }}" class="btn">✨ Confirmar Email</a>
<div class="note">
<p><strong>🔒 Segurança:</strong> Este link expira em 24 horas. Se você não criou esta conta, pode ignorar este email.</p>
</div>
<p style="margin-top:30px">Prepare-se para transformar sua vida financeira! Com o por.quinho, cada economia conta.</p>
</div>
<div class="footer">
<p>© 2024 por.quinho - De pouco em pouco se enche o porquinho</p>
<p>Uma forma inteligente de cuidar do seu dinheiro 🐷💰</p>
</div>
</div>
</div>
</body>
</html>'

MAGIC_LINK_TEMPLATE='<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Acesso rápido - por.quinho</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
body{margin:0;padding:0;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background-color:#fdf2f8;line-height:1.6}
.container{max-width:600px;margin:0 auto;padding:20px;background-color:#fdf2f8}
.card{background-color:#fff;border-radius:16px;box-shadow:0 10px 25px rgba(236,72,153,0.1);overflow:hidden;border:1px solid #fce7f3}
.header{background:linear-gradient(135deg,#ec4899 0%,#be185d 100%);padding:40px 30px;text-align:center;color:#fff}
.header h1{margin:0;font-size:28px;font-weight:700;margin-bottom:8px}
.tagline{margin:0;font-size:14px;opacity:0.9;font-style:italic;font-weight:300}
.body{padding:40px 30px}
.body h2{color:#be185d;font-size:24px;font-weight:600;margin:0 0 20px 0;text-align:center}
.body p{color:#374151;font-size:16px;margin:0 0 20px 0;text-align:center}
.btn{display:block;background:linear-gradient(135deg,#ec4899 0%,#be185d 100%);color:#fff!important;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;text-align:center;margin:20px auto;width:fit-content;box-shadow:0 4px 12px rgba(236,72,153,0.3)}
.note{background-color:#fef3cd;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:20px 0}
.note p{color:#92400e;font-size:14px;margin:0;text-align:left}
.footer{background-color:#f9fafb;padding:30px;text-align:center;border-top:1px solid #f3f4f6}
.footer p{color:#6b7280;font-size:14px;margin:0}
@media only screen and (max-width:600px){.container{padding:10px}.header{padding:30px 20px}.body{padding:30px 20px}.footer{padding:20px}.header h1{font-size:24px}.body h2{font-size:20px}}
</style>
</head>
<body>
<div class="container">
<div class="card">
<div class="header">
<h1>🐷 Acesso rápido ao por.quinho</h1>
<p class="tagline">De pouco em pouco se enche o porquinho</p>
</div>
<div class="body">
<h2>Seu link mágico chegou! ✨</h2>
<p>Clique no botão abaixo para acessar sua conta de forma segura:</p>
<a href="{{ .ConfirmationURL }}" class="btn">🚀 Entrar no por.quinho</a>
<div class="note">
<p><strong>🔒 Segurança:</strong> Este link é único e expira em 1 hora. Use apenas se você solicitou o acesso.</p>
</div>
<p style="margin-top:30px">Continue cuidando bem do seu dinheiro! Cada centavo economizado nos deixa mais próximos dos nossos sonhos. 🌟</p>
</div>
<div class="footer">
<p>© 2024 por.quinho - De pouco em pouco se enche o porquinho</p>
<p>Sua jornada financeira simplificada 🐷💰</p>
</div>
</div>
</div>
</body>
</html>'

RECOVERY_TEMPLATE='<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Redefinir senha - por.quinho</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
body{margin:0;padding:0;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background-color:#fdf2f8;line-height:1.6}
.container{max-width:600px;margin:0 auto;padding:20px;background-color:#fdf2f8}
.card{background-color:#fff;border-radius:16px;box-shadow:0 10px 25px rgba(236,72,153,0.1);overflow:hidden;border:1px solid #fce7f3}
.header{background:linear-gradient(135deg,#ec4899 0%,#be185d 100%);padding:40px 30px;text-align:center;color:#fff}
.header h1{margin:0;font-size:28px;font-weight:700;margin-bottom:8px}
.tagline{margin:0;font-size:14px;opacity:0.9;font-style:italic;font-weight:300}
.body{padding:40px 30px}
.body h2{color:#be185d;font-size:24px;font-weight:600;margin:0 0 20px 0;text-align:center}
.body p{color:#374151;font-size:16px;margin:0 0 20px 0;text-align:center}
.btn{display:block;background:linear-gradient(135deg,#ec4899 0%,#be185d 100%);color:#fff!important;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;text-align:center;margin:20px auto;width:fit-content;box-shadow:0 4px 12px rgba(236,72,153,0.3)}
.note{background-color:#fef3cd;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:20px 0}
.note p{color:#92400e;font-size:14px;margin:0;text-align:left}
.footer{background-color:#f9fafb;padding:30px;text-align:center;border-top:1px solid #f3f4f6}
.footer p{color:#6b7280;font-size:14px;margin:0}
@media only screen and (max-width:600px){.container{padding:10px}.header{padding:30px 20px}.body{padding:30px 20px}.footer{padding:20px}.header h1{font-size:24px}.body h2{font-size:20px}}
</style>
</head>
<body>
<div class="container">
<div class="card">
<div class="header">
<h1>🐷 Redefinir senha - por.quinho</h1>
<p class="tagline">De pouco em pouco se enche o porquinho</p>
</div>
<div class="body">
<h2>Recuperação de senha 🔑</h2>
<p>Esqueceu sua senha? Não se preocupe, isso acontece com todo mundo!</p>
<p>Clique no botão abaixo para criar uma nova senha e voltar a cuidar das suas finanças:</p>
<a href="{{ .ConfirmationURL }}" class="btn">🔐 Redefinir Senha</a>
<div class="note">
<p><strong>🔒 Importante:</strong> Este link expira em 1 hora. Se você não solicitou esta recuperação, pode ignorar este email - sua conta permanecerá segura.</p>
</div>
<p style="margin-top:30px">Dica: Escolha uma senha forte para manter seus dados financeiros sempre protegidos! 🛡️</p>
</div>
<div class="footer">
<p>© 2024 por.quinho - De pouco em pouco se enche o porquinho</p>
<p>Segurança e simplicidade em suas finanças 🐷💰</p>
</div>
</div>
</div>
</body>
</html>'

INVITE_TEMPLATE='<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Você foi convidado - por.quinho</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
body{margin:0;padding:0;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background-color:#fdf2f8;line-height:1.6}
.container{max-width:600px;margin:0 auto;padding:20px;background-color:#fdf2f8}
.card{background-color:#fff;border-radius:16px;box-shadow:0 10px 25px rgba(236,72,153,0.1);overflow:hidden;border:1px solid #fce7f3}
.header{background:linear-gradient(135deg,#ec4899 0%,#be185d 100%);padding:40px 30px;text-align:center;color:#fff}
.header h1{margin:0;font-size:28px;font-weight:700;margin-bottom:8px}
.tagline{margin:0;font-size:14px;opacity:0.9;font-style:italic;font-weight:300}
.body{padding:40px 30px}
.body h2{color:#be185d;font-size:24px;font-weight:600;margin:0 0 20px 0;text-align:center}
.body p{color:#374151;font-size:16px;margin:0 0 20px 0;text-align:center}
.btn{display:block;background:linear-gradient(135deg,#ec4899 0%,#be185d 100%);color:#fff!important;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;text-align:center;margin:20px auto;width:fit-content;box-shadow:0 4px 12px rgba(236,72,153,0.3)}
.note{background-color:#e0f2fe;border:1px solid #0ea5e9;border-radius:8px;padding:16px;margin:20px 0}
.note p{color:#0c4a6e;font-size:14px;margin:0;text-align:left}
.footer{background-color:#f9fafb;padding:30px;text-align:center;border-top:1px solid #f3f4f6}
.footer p{color:#6b7280;font-size:14px;margin:0}
@media only screen and (max-width:600px){.container{padding:10px}.header{padding:30px 20px}.body{padding:30px 20px}.footer{padding:20px}.header h1{font-size:24px}.body h2{font-size:20px}}
</style>
</head>
<body>
<div class="container">
<div class="card">
<div class="header">
<h1>🐷 Você foi convidado!</h1>
<p class="tagline">De pouco em pouco se enche o porquinho</p>
</div>
<div class="body">
<h2>Junte-se ao por.quinho! 🎉</h2>
<p>Alguém especial te convidou para descobrir uma nova forma de cuidar do dinheiro!</p>
<p>O por.quinho é uma plataforma moderna que te ajuda a economizar e controlar seus gastos de forma simples e intuitiva.</p>
<a href="{{ .ConfirmationURL }}" class="btn">🌟 Aceitar Convite</a>
<div class="note">
<p><strong>🎁 Especial:</strong> Este convite é exclusivo para você! Crie sua conta em {{ .SiteURL }} e comece a transformar sua vida financeira.</p>
</div>
<p style="margin-top:30px">Vem fazer parte da nossa comunidade de pessoas que acreditam que pequenas economias fazem grandes diferenças! 💪</p>
</div>
<div class="footer">
<p>© 2024 por.quinho - De pouco em pouco se enche o porquinho</p>
<p>Junte-se a quem já descobriu o segredo da economia inteligente 🐷💰</p>
</div>
</div>
</div>
</body>
</html>'

EMAIL_CHANGE_TEMPLATE='<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmar novo email - por.quinho</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
body{margin:0;padding:0;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background-color:#fdf2f8;line-height:1.6}
.container{max-width:600px;margin:0 auto;padding:20px;background-color:#fdf2f8}
.card{background-color:#fff;border-radius:16px;box-shadow:0 10px 25px rgba(236,72,153,0.1);overflow:hidden;border:1px solid #fce7f3}
.header{background:linear-gradient(135deg,#ec4899 0%,#be185d 100%);padding:40px 30px;text-align:center;color:#fff}
.header h1{margin:0;font-size:28px;font-weight:700;margin-bottom:8px}
.tagline{margin:0;font-size:14px;opacity:0.9;font-style:italic;font-weight:300}
.body{padding:40px 30px}
.body h2{color:#be185d;font-size:24px;font-weight:600;margin:0 0 20px 0;text-align:center}
.body p{color:#374151;font-size:16px;margin:0 0 20px 0;text-align:center}
.btn{display:block;background:linear-gradient(135deg,#ec4899 0%,#be185d 100%);color:#fff!important;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;text-align:center;margin:20px auto;width:fit-content;box-shadow:0 4px 12px rgba(236,72,153,0.3)}
.note{background-color:#fef3cd;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:20px 0}
.note p{color:#92400e;font-size:14px;margin:0;text-align:left}
.footer{background-color:#f9fafb;padding:30px;text-align:center;border-top:1px solid #f3f4f6}
.footer p{color:#6b7280;font-size:14px;margin:0}
@media only screen and (max-width:600px){.container{padding:10px}.header{padding:30px 20px}.body{padding:30px 20px}.footer{padding:20px}.header h1{font-size:24px}.body h2{font-size:20px}}
</style>
</head>
<body>
<div class="container">
<div class="card">
<div class="header">
<h1>🐷 Confirmar novo email</h1>
<p class="tagline">De pouco em pouco se enche o porquinho</p>
</div>
<div class="body">
<h2>Atualizando seu email 📧</h2>
<p>Você solicitou a alteração do email da sua conta no por.quinho.</p>
<p>Para confirmar este novo endereço de email, clique no botão abaixo:</p>
<a href="{{ .ConfirmationURL }}" class="btn">✅ Confirmar Novo Email</a>
<div class="note">
<p><strong>🔒 Verificação:</strong> Esta confirmação expira em 24 horas. Se você não solicitou esta mudança, entre em contato conosco imediatamente.</p>
</div>
<p style="margin-top:30px">Mantenha seus dados sempre atualizados para receber as melhores dicas de economia! 📈</p>
</div>
<div class="footer">
<p>© 2024 por.quinho - De pouco em pouco se enche o porquinho</p>
<p>Seus dados seguros, sua economia crescendo 🐷💰</p>
</div>
</div>
</div>
</body>
</html>'

# Atualizar templates no Supabase
echo -e "${BLUE}📧 Atualizando templates de email...${NC}"

response=$(curl -s -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"mailer_subjects_confirmation\": \"🐷 Confirme seu cadastro no por.quinho\",
    \"mailer_templates_confirmation_content\": \"$CONFIRMATION_TEMPLATE\",
    \"mailer_subjects_magic_link\": \"🚀 Seu acesso rápido ao por.quinho\",
    \"mailer_templates_magic_link_content\": \"$MAGIC_LINK_TEMPLATE\",
    \"mailer_subjects_recovery\": \"🔑 Redefinir senha - por.quinho\",
    \"mailer_templates_recovery_content\": \"$RECOVERY_TEMPLATE\",
    \"mailer_subjects_invite\": \"🎉 Você foi convidado para o por.quinho!\",
    \"mailer_templates_invite_content\": \"$INVITE_TEMPLATE\",
    \"mailer_subjects_email_change\": \"📧 Confirme seu novo email - por.quinho\",
    \"mailer_templates_email_change_content\": \"$EMAIL_CHANGE_TEMPLATE\"
  }")

if echo "$response" | grep -q '"status":"success"' || echo "$response" | grep -q '"message":"Updated"' || [ -z "$response" ]; then
    echo -e "${GREEN}✅ Templates atualizados com sucesso!${NC}"
    echo
    echo -e "${GREEN}🎉 Configuração concluída! Seus emails agora têm:${NC}"
    echo -e "${BLUE}   🐷 Tema visual do por.quinho${NC}"
    echo -e "${BLUE}   💌 Design responsivo e moderno${NC}"
    echo -e "${BLUE}   🎨 Cores rosa/pink da marca${NC}"
    echo -e "${BLUE}   📱 Otimização para mobile${NC}"
    echo -e "${BLUE}   🔒 Avisos de segurança claros${NC}"
    echo
    echo -e "${YELLOW}📝 Templates configurados:${NC}"
    echo "   ✉️  Confirmação de cadastro"
    echo "   🔗 Magic link de acesso"
    echo "   🔐 Recuperação de senha"
    echo "   🎁 Convite de usuário"
    echo "   📧 Mudança de email"
    echo
    echo -e "${PURPLE}🐷 De pouco em pouco, seus usuários vão amar os emails!${NC}"
else
    echo -e "${RED}❌ Erro ao atualizar templates:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    exit 1
fi
