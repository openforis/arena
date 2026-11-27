export default {
  loginView: {
    title: 'Entrar',
    subtitle: 'Bem-vindo! Insira suas credenciais para acessar o $t(common.appNameFull).',
    backToLogin: 'Voltar para o login',
    noAccountYet: 'Ainda não tem uma conta?',
    createAccount: 'Criar uma conta',
    invitedToSurvey:
      'Foi convidado para um inquérito? Não precisa de criar uma conta: abra o link do e-mail de convite e siga os passos.',
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
  externalLogin: {
    signInWith: 'Entrar com {{provider}}',
    continueWith: 'Continuar com {{provider}}',
    registeredUsersOnly: 'Somente usuários registrados',
    errors: {
      providerNotAvailable:
        'Esta opção de início de sessão não está disponível. Tente mais tarde ou entre com o seu e-mail e palavra-passe.',
      flowInvalid: 'O início de sessão expirou ou foi iniciado noutro navegador. Tente novamente.',
      providerError: 'O início de sessão com o fornecedor externo falhou. Tente novamente.',
      emailNotVerified:
        'O fornecedor não confirmou o seu endereço de e-mail, por isso não pode ser associado a uma conta. Entre com a sua palavra-passe e associe o fornecedor a partir do seu perfil.',
      emailDomainNotAllowed: 'As contas com este domínio de e-mail não podem usar esta opção de início de sessão.',
      userNotFound:
        'Não existe nenhuma conta com este endereço de e-mail. Peça um convite a um administrador do inquérito ou solicite acesso.',
      userNotFoundCreateAccount:
        'Não existe nenhuma conta com este endereço de e-mail. Crie primeiro uma conta ou peça um convite a um administrador do inquérito.',
      ambiguousEmail:
        'Mais de uma conta corresponde a este endereço de e-mail. Entre com a sua palavra-passe e associe o fornecedor a partir do seu perfil.',
      identityAlreadyLinked: 'Esta conta do fornecedor já está associada a outro utilizador.',
      providerAlreadyLinked:
        'Outra conta deste fornecedor já está associada ao seu utilizador: desassocie-a primeiro a partir do seu perfil.',
      invitationInvalid: 'O convite não é válido ou expirou. Peça um novo ao administrador do inquérito.',
      invalidTwoFactorCode: 'Código de verificação inválido.',
    },
  },
  accessRequestView: {
    whatHappensNext: 'O que acontece depois?',
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
          'Você receberá um e-mail de **{{senderEmail}}** com o link para acessar o $t(common.appName). Não está na sua caixa de entrada? Verifique a pasta de spam/lixo eletrônico e adicione o remetente aos seus contatos ou marque o e-mail como não spam.',
        descriptionWithoutSender:
          'Você receberá um e-mail com o link para acessar o $t(common.appName). Não está na sua caixa de entrada? Verifique a pasta de spam/lixo eletrônico e adicione o remetente aos seus contatos ou marque o e-mail como não spam.',
      },
      startWorking: {
        title: 'Comece a trabalhar',
        description: 'Você será Administrador da nova pesquisa e poderá criar até 5 pesquisas.',
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
  registrationView: {
    title: 'Criar uma conta',
    introduction:
      'Crie a sua conta e o seu primeiro inquérito: diga-nos o que pretende fazer com o $t(common.appName)!',
    createAccount: 'Criar conta',
    createAccountConfirm: 'Criar a sua conta no $t(common.appNameFull)?',
    accountCreated: 'Conta criada',
    accountCreatedMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Abra o link do e-mail para confirmar o seu endereço de e-mail e concluir o registo: escolha a sua senha ou entre com uma das opções de início de sessão disponíveis (por ex., Google).

Obrigado e aproveite o **$t(common.appNameFull)**!`,
    error: 'Erro ao criar a conta: {{error}}',
    steps: {
      createAccount: {
        title: 'Crie a sua conta',
        description: '$t(guest:accessRequestView.steps.sendRequest.description)',
      },
      confirmEmail: {
        title: 'Confirme o seu e-mail',
        description:
          'Receberá um e-mail de **{{senderEmail}}** com o link para concluir o registo. Não está na caixa de entrada? Verifique a pasta de Spam/Lixo eletrónico e, depois, adicione o remetente aos seus contactos ou marque o e-mail como não spam.',
        descriptionWithoutSender:
          'Receberá um e-mail com o link para concluir o registo. Não está na caixa de entrada? Verifique a pasta de Spam/Lixo eletrónico e, depois, adicione o remetente aos seus contactos ou marque o e-mail como não spam.',
      },
      startWorking: {
        title: '$t(guest:accessRequestView.steps.startWorking.title)',
        description: '$t(guest:accessRequestView.steps.startWorking.description)',
      },
    },
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
