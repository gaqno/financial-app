/**
 * Templates de Email Personalizados para por.quinho
 *
 * Design moderno e responsivo com tema rosa/pink
 * Conceito: "De pouco em pouco se enche o porquinho"
 */

// CSS comum para todos os templates
const emailCSS = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #fdf2f8;
    line-height: 1.6;
  }
  
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fdf2f8;
  }
  
  .email-card {
    background-color: #ffffff;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(236, 72, 153, 0.1);
    overflow: hidden;
    border: 1px solid #fce7f3;
  }
  
  .email-header {
    background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
    padding: 40px 30px;
    text-align: center;
    color: white;
  }
  
  .email-header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .email-header .tagline {
    margin: 0;
    font-size: 14px;
    opacity: 0.9;
    font-style: italic;
    font-weight: 300;
  }
  
  .email-body {
    padding: 40px 30px;
  }
  
  .email-body h2 {
    color: #be185d;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 20px 0;
    text-align: center;
  }
  
  .email-body p {
    color: #374151;
    font-size: 16px;
    margin: 0 0 20px 0;
    text-align: center;
  }
  
  .cta-button {
    display: inline-block;
    background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
    color: white !important;
    text-decoration: none;
    padding: 16px 32px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    text-align: center;
    margin: 20px auto;
    display: block;
    width: fit-content;
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
    transition: all 0.3s ease;
  }
  
  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(236, 72, 153, 0.4);
  }
  
  .email-footer {
    background-color: #f9fafb;
    padding: 30px;
    text-align: center;
    border-top: 1px solid #f3f4f6;
  }
  
  .email-footer p {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
  }
  
  .security-note {
    background-color: #fef3cd;
    border: 1px solid #fbbf24;
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
  }
  
  .security-note p {
    color: #92400e;
    font-size: 14px;
    margin: 0;
    text-align: left;
  }
  
  @media only screen and (max-width: 600px) {
    .email-container {
      padding: 10px;
    }
    
    .email-header {
      padding: 30px 20px;
    }
    
    .email-body {
      padding: 30px 20px;
    }
    
    .email-footer {
      padding: 20px;
    }
    
    .email-header h1 {
      font-size: 24px;
    }
    
    .email-body h2 {
      font-size: 20px;
    }
  }
</style>
`;

// Template de Confirmação de Cadastro
const confirmationTemplate = `
${emailCSS}
<div class="email-container">
  <div class="email-card">
    <div class="email-header">
      <h1>🐷 Bem-vindo ao por.quinho!</h1>
      <p class="tagline">De pouco em pouco se enche o porquinho</p>
    </div>
    
    <div class="email-body">
      <h2>Confirme seu cadastro</h2>
      <p>Estamos muito felizes em ter você conosco! 🎉</p>
      <p>Para começar sua jornada rumo à independência financeira, precisamos confirmar seu email.</p>
      
      <a href="{{ .ConfirmationURL }}" class="cta-button">
        ✨ Confirmar Email
      </a>
      
      <div class="security-note">
        <p><strong>🔒 Segurança:</strong> Este link expira em 24 horas. Se você não criou esta conta, pode ignorar este email.</p>
      </div>
      
      <p style="margin-top: 30px;">Prepare-se para transformar sua vida financeira! Com o por.quinho, cada economia conta.</p>
    </div>
    
    <div class="email-footer">
      <p>© 2024 por.quinho - De pouco em pouco se enche o porquinho</p>
      <p>Uma forma inteligente de cuidar do seu dinheiro 🐷💰</p>
    </div>
  </div>
</div>
`;

// Template de Magic Link
const magicLinkTemplate = `
${emailCSS}
<div class="email-container">
  <div class="email-card">
    <div class="email-header">
      <h1>🐷 Acesso rápido ao por.quinho</h1>
      <p class="tagline">De pouco em pouco se enche o porquinho</p>
    </div>
    
    <div class="email-body">
      <h2>Seu link mágico chegou! ✨</h2>
      <p>Clique no botão abaixo para acessar sua conta de forma segura:</p>
      
      <a href="{{ .ConfirmationURL }}" class="cta-button">
        🚀 Entrar no por.quinho
      </a>
      
      <div class="security-note">
        <p><strong>🔒 Segurança:</strong> Este link é único e expira em 1 hora. Use apenas se você solicitou o acesso.</p>
      </div>
      
      <p style="margin-top: 30px;">Continue cuidando bem do seu dinheiro! Cada centavo economizado nos deixa mais próximos dos nossos sonhos. 🌟</p>
    </div>
    
    <div class="email-footer">
      <p>© 2024 por.quinho - De pouco em pouco se enche o porquinho</p>
      <p>Sua jornada financeira simplificada 🐷💰</p>
    </div>
  </div>
</div>
`;

// Template de Recuperação de Senha
const recoveryTemplate = `
${emailCSS}
<div class="email-container">
  <div class="email-card">
    <div class="email-header">
      <h1>🐷 Redefinir senha - por.quinho</h1>
      <p class="tagline">De pouco em pouco se enche o porquinho</p>
    </div>
    
    <div class="email-body">
      <h2>Recuperação de senha 🔑</h2>
      <p>Esqueceu sua senha? Não se preocupe, isso acontece com todo mundo!</p>
      <p>Clique no botão abaixo para criar uma nova senha e voltar a cuidar das suas finanças:</p>
      
      <a href="{{ .ConfirmationURL }}" class="cta-button">
        🔐 Redefinir Senha
      </a>
      
      <div class="security-note">
        <p><strong>🔒 Importante:</strong> Este link expira em 1 hora. Se você não solicitou esta recuperação, pode ignorar este email - sua conta permanecerá segura.</p>
      </div>
      
      <p style="margin-top: 30px;">Dica: Escolha uma senha forte para manter seus dados financeiros sempre protegidos! 🛡️</p>
    </div>
    
    <div class="email-footer">
      <p>© 2024 por.quinho - De pouco em pouco se enche o porquinho</p>
      <p>Segurança e simplicidade em suas finanças 🐷💰</p>
    </div>
  </div>
</div>
`;

// Template de Convite
const inviteTemplate = `
${emailCSS}
<div class="email-container">
  <div class="email-card">
    <div class="email-header">
      <h1>🐷 Você foi convidado!</h1>
      <p class="tagline">De pouco em pouco se enche o porquinho</p>
    </div>
    
    <div class="email-body">
      <h2>Junte-se ao por.quinho! 🎉</h2>
      <p>Alguém especial te convidou para descobrir uma nova forma de cuidar do dinheiro!</p>
      <p>O por.quinho é uma plataforma moderna que te ajuda a economizar e controlar seus gastos de forma simples e intuitiva.</p>
      
      <a href="{{ .ConfirmationURL }}" class="cta-button">
        🌟 Aceitar Convite
      </a>
      
      <div class="security-note">
        <p><strong>🎁 Especial:</strong> Este convite é exclusivo para você! Crie sua conta em {{ .SiteURL }} e comece a transformar sua vida financeira.</p>
      </div>
      
      <p style="margin-top: 30px;">Vem fazer parte da nossa comunidade de pessoas que acreditam que pequenas economias fazem grandes diferenças! 💪</p>
    </div>
    
    <div class="email-footer">
      <p>© 2024 por.quinho - De pouco em pouco se enche o porquinho</p>
      <p>Junte-se a quem já descobriu o segredo da economia inteligente 🐷💰</p>
    </div>
  </div>
</div>
`;

// Template de Mudança de Email
const emailChangeTemplate = `
${emailCSS}
<div class="email-container">
  <div class="email-card">
    <div class="email-header">
      <h1>🐷 Confirmar novo email</h1>
      <p class="tagline">De pouco em pouco se enche o porquinho</p>
    </div>
    
    <div class="email-body">
      <h2>Atualizando seu email 📧</h2>
      <p>Você solicitou a alteração do email da sua conta no por.quinho.</p>
      <p>Para confirmar este novo endereço de email, clique no botão abaixo:</p>
      
      <a href="{{ .ConfirmationURL }}" class="cta-button">
        ✅ Confirmar Novo Email
      </a>
      
      <div class="security-note">
        <p><strong>🔒 Verificação:</strong> Esta confirmação expira em 24 horas. Se você não solicitou esta mudança, entre em contato conosco imediatamente.</p>
      </div>
      
      <p style="margin-top: 30px;">Mantenha seus dados sempre atualizados para receber as melhores dicas de economia! 📈</p>
    </div>
    
    <div class="email-footer">
      <p>© 2024 por.quinho - De pouco em pouco se enche o porquinho</p>
      <p>Seus dados seguros, sua economia crescendo 🐷💰</p>
    </div>
  </div>
</div>
`;

// Configuração para atualização no Supabase
const supabaseConfig = {
  mailer_subjects_confirmation: "🐷 Confirme seu cadastro no por.quinho",
  mailer_templates_confirmation_content: confirmationTemplate,
  mailer_subjects_magic_link: "🚀 Seu acesso rápido ao por.quinho",
  mailer_templates_magic_link_content: magicLinkTemplate,
  mailer_subjects_recovery: "🔑 Redefinir senha - por.quinho",
  mailer_templates_recovery_content: recoveryTemplate,
  mailer_subjects_invite: "🎉 Você foi convidado para o por.quinho!",
  mailer_templates_invite_content: inviteTemplate,
  mailer_subjects_email_change: "📧 Confirme seu novo email - por.quinho",
  mailer_templates_email_change_content: emailChangeTemplate,
};

console.log("📧 Templates de Email criados para por.quinho!");
console.log("✨ Use o objeto supabaseConfig para atualizar no Supabase");

module.exports = {
  supabaseConfig,
  confirmationTemplate,
  magicLinkTemplate,
  recoveryTemplate,
  inviteTemplate,
  emailChangeTemplate,
};
