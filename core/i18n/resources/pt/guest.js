export default {
  loginView: {
    title: 'Entrar',
    subtitle: 'Bem-vindo! Insira suas credenciais para acessar o $t(common.appNameFull).',
    backToLogin: 'Voltar para o login',
    newToArena: 'Novo no $t(common.appNameFull)?',
    or: 'ou',
    twoFactorTitle: 'Verificação em duas etapas',
    verify: 'Verificar',
    lostYourDevice: 'Não consegue usar seu aplicativo autenticador?',
    yourName: 'Seu nome',
    yourEmail: 'Seu email',
    yourPassword: 'Sua senha',
    yourNewPassword: 'Sua nova senha',
    repeatYourPassword: 'Repita sua senha',
    repeatYourNewPassword: 'Repita sua nova senha',
    requestAccess: 'Solicitar acesso',
    resetPassword: 'Redefinir senha',
    login: 'Entrar',
    loginUsingBackupCode: 'Usar um código de backup',
    forgotPassword: 'Esqueceu a senha?',
    sendPasswordResetEmail: 'Enviar email de redefinição de senha',
    twoFactorBackupCode: 'Código de backup 2FA',
    twoFactorToken: 'Código de verificação',
    twoFactorTokenDescription: `Para manter sua conta segura, verificamos sua identidade.

Insira o código gerado pelo seu aplicativo autenticador.`,
  },
  accessRequestView: {
    alreadyHaveAnAccount: 'Já tem uma conta?',
    steps: {
      sendRequest: {
        title: 'Envie a solicitação',
        description:
          'Sugira um nome para sua primeira pesquisa: comece com uma pesquisa em branco ou a partir de um modelo.',
      },
      review: {
        title: 'Nós a analisamos',
        description: 'Por favor, aguarde alguns dias para processarmos sua solicitação.',
      },
      invitation: {
        title: 'Receba seu convite',
        description:
          'Você receberá um e-mail para acessar o $t(common.appName): será Administrador da nova pesquisa e poderá criar até 5 pesquisas.',
      },
    },
    error: 'Erro ao solicitar acesso: {{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        firstName: 'Primeiro nome',
        lastName: 'Sobrenome',
        institution: 'Instituição',
        country: 'País',
        purpose: 'Para que você precisa?',
        surveyName: 'Proponha um nome para o inventário',
        templateUuid: 'Começar com um modelo?',
      },
    },
    introduction:
      'Nossos recursos são limitados, por isso o acesso é concedido mediante solicitação. Conte-nos o que você quer fazer com o $t(common.appName)!',
    reCaptchaNotAnswered: 'ReCaptcha não respondido',
    requestSent: 'Solicitação de acesso enviada com sucesso',
    requestSentMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Por favor, dê-nos alguns dias para processar sua solicitação.
Assim que ela for aceita, enviaremos outro email para **{{email}}** com as instruções de como acessar $t(common.appName).
Obrigado e aproveite **$t(common.appNameFull)**!`,
    sendRequest: 'Enviar solicitação',
    sendRequestConfirm: 'Solicitar acesso ao $t(common.appNameFull)?',
    templateNotSelected: 'Não selecionado (começar do zero)',
    title: 'Solicitar acesso',
    whitelistSenderSuggestion:
      'Se você o encontrar na pasta de Spam/Lixo eletrônico, adicione **{{senderEmail}}** aos seus contatos (catálogo de endereços) ou marque-o como seguro/não é spam, para que nossos próximos emails cheguem diretamente à sua caixa de entrada.',
  },
  resetPasswordView: {
    description: {
      completeRegistration: 'Configure sua conta para começar.',
      setYourNewPassword: 'Escolha uma nova senha para sua conta.',
    },
    title: {
      completeRegistration: 'Conclua seu cadastro no Arena',
      setYourNewPassword: 'Defina sua nova senha',
    },
    setNewPassword: 'Definir nova senha',
    forgotPasswordLinkInvalid: 'A página que você tentou acessar não existe ou não é mais válida',
    passwordSuccessfullyReset: 'Sua senha foi redefinida com sucesso',
    passwordStrengthChecksTitle: 'Verificações de força da senha',
    passwordStrengthChecks: {
      noWhiteSpaces: 'Sem espaços em branco',
      atLeast8CharactersLong: 'Pelo menos 8 caracteres',
      containsLowerCaseLetters: 'Contém letras minúsculas',
      containsUpperCaseLetters: 'Contém letras maiúsculas',
      containsNumbers: 'Contém números',
    },
    completeRegistration: 'Concluir cadastro',
  },
  forgotPasswordView: {
    title: 'Redefinir sua senha',
    description: 'Insira o e-mail da sua conta e enviaremos um link para escolher uma nova senha.',
  },
  pitch: {
    default: {
      title: 'Dados de campo, da coleta à análise.',
      description:
        'Crie formulários multilíngues, gerencie inventários de vários ciclos, valide a qualidade dos dados e analise os resultados com o RStudio integrado.',
    },
    accessRequest: {
      title: 'Comece sua primeira pesquisa no $t(common.appName).',
      description:
        'Conte-nos sobre seu projeto. Depois de aprovado, você poderá criar formulários, convidar suas equipes de campo e analisar os dados em um só lugar.',
    },
    tags: {
      forestInventories: 'Inventários florestais',
      questionnaires: 'Questionários',
      multiCycle: 'Vários ciclos',
      statisticalAnalysis: 'Análise estatística',
    },
  },
  footer: {
    website: 'Sobre o $t(common.appName)',
    userManual: 'Manual do usuário',
    supportForum: 'Fórum de suporte',
    version: 'Versão {{version}}',
  },
}
