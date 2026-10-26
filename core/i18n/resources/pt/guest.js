export default {
  loginView: {
    yourName: 'Seu nome',
    yourEmail: 'Seu email',
    yourPassword: 'Sua senha',
    yourNewPassword: 'Sua nova senha',
    repeatYourPassword: 'Repita sua senha',
    repeatYourNewPassword: 'Repita sua nova senha',
    requestAccess: 'Novo no $t(common.appNameFull)? Solicite acesso',
    resetPassword: 'Redefinir senha',
    login: 'Entrar',
    loginUsingBackupCode: 'Entrar com código de backup 2FA',
    forgotPassword: 'Esqueceu a senha',
    sendPasswordResetEmail: 'Enviar email de redefinição de senha',
    twoFactorBackupCode: 'Código de backup 2FA',
    twoFactorToken: 'Código de verificação',
    twoFactorTokenDescription: `Para manter sua conta segura, verificamos sua identidade.

Insira o código gerado pelo seu aplicativo autenticador.`,
  },
  accessRequestView: {
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
    introduction: `Nossos recursos são limitados, então você deve solicitar acesso à plataforma.
  Também estamos interessados ​​no que você deseja fazer com ela, então informe-nos!
  Você pode começar a partir de um **novo inventário em branco** ou clonar um **modelo** existente, e deverá sugerir um nome para o inventário recém-criado.
  Você receberá a função de ***Administrador do Inventário*** para esse inventário: poderá editá-lo e convidar novos usuários para participar do seu inventário e contribuir com ele.
  Você também será um ***Gerente de Inventários*** e poderá **criar novos inventários** (até 5), se necessário.
Para mais informações, visite nosso site: $t(links.openforisArenaWebsite)
$t(common.raiseTicketInSupportForum)
**Depois de enviar a solicitação, aguarde um e-mail de convite para acessar a Arena.**`,
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
    title: 'Solicitando acesso ao $t(common.appNameFull)',
    whitelistSenderSuggestion:
      'Se você o encontrar na pasta de Spam/Lixo eletrônico, adicione **{{senderEmail}}** aos seus contatos (catálogo de endereços) ou marque-o como seguro/não é spam, para que nossos próximos emails cheguem diretamente à sua caixa de entrada.',
  },
  resetPasswordView: {
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
}
