export default {
  title: 'Fornecedores de início de sessão',
  subtitle:
    'Opções externas de início de sessão exibidas na página de login, nesta ordem. Os usuários também podem entrar com email e senha.',
  addProvider: 'Adicionar fornecedor',
  continue: 'Continuar',
  encryptionKeyMissing:
    'A chave de criptografia dos segredos de cliente não está configurada: defina AUTH_PROVIDER_SECRET_ENCRYPTION_KEY (64 caracteres hexadecimais) no servidor e reinicie o Arena para adicionar fornecedores.',
  empty: {
    title: 'Ainda não há fornecedores de início de sessão',
    description:
      'Permita que os usuários entrem com Google, Microsoft ou o login único (SSO) da sua organização, além de email e senha.',
  },
  columns: {
    provider: 'Fornecedor',
    type: 'Tipo',
    status: 'Estado',
    loginPage: 'Página de login',
    linkedUsers: 'Usuários associados',
    actions: 'Ações',
  },
  passwordAlwaysAvailable:
    'O início de sessão com email e senha está sempre disponível. As alterações chegam a todas as instâncias do servidor em até um minuto.',
  status: {
    enabled: 'Ativado',
    disabled: 'Desativado',
  },
  source: {
    env: 'configuração do servidor',
  },
  types: {
    google: 'Google',
    microsoft: 'Microsoft',
    oidc: 'OpenID Connect',
  },
  loginPage: {
    shown: 'Exibido',
    directLinkOnly: 'Apenas link direto',
  },
  moveUp: 'Mover para cima',
  moveDown: 'Mover para baixo',
  enable: 'Ativar',
  disable: 'Desativar',
  deleteConfirm:
    'Excluir o fornecedor de início de sessão "{{provider}}"? As associações dos seus {{linkedUsersCount}} usuários serão removidas (para bloquear os inícios de sessão mas manter as associações, desative-o).\n\nUsuários que ficarão sem nenhum método de início de sessão (receberão um email explicando como definir uma senha): {{usersWithoutOtherMethod}}',
  addDialog: {
    description: 'Escolha o tipo de fornecedor. Pode alterar o rótulo e o ícone depois.',
    typeDescription: {
      google: 'Contas Google, incluindo Gmail e Google Workspace.',
      microsoft: 'Contas Microsoft profissionais, escolares ou pessoais (Entra ID).',
      oidc: 'Qualquer outro fornecedor: Keycloak, Okta, Auth0, o SSO da sua organização...',
    },
    notSupportedYet: 'Facebook, GitHub e Apple ainda não são suportados.',
  },
  form: {
    errors: 'Não é possível salvar o fornecedor: {{errors}}',
    newTitle: 'Novo fornecedor {{type}}',
    general: 'Geral',
    label: 'Rótulo do botão',
    id: 'Identificador',
    idInfo:
      'Usado nas URLs e para associar as contas de usuário: letras minúsculas, dígitos e hífens. Não pode ser alterado após a criação.',
    icon: 'Ícone',
    useUploadedIcon: 'Usar o ícone carregado',
    iconInvalid: 'Ícone inválido: use um arquivo PNG ou SVG de até 100 KB.',
    enabled: 'Ativado',
    enabledInfo:
      'Quando desativado, o botão fica oculto e os inícios de sessão com este fornecedor são recusados. As contas associadas são mantidas.',
    showOnLoginPage: 'Exibir na página de login',
    showOnLoginPageInfo:
      'Quando desligado, o fornecedor não tem botão na página de login: os usuários entram com ele usando o link direto {{path}}',
    connection: 'Conexão',
    issuer: 'URL do emissor',
    issuerInfo: 'O Arena lê os outros endpoints de <issuer>/.well-known/openid-configuration.',
    tenant: 'Tenant',
    tenantInfo:
      'ID do tenant da sua organização, ou "organizations" (qualquer conta profissional ou escolar), "consumers" (contas pessoais) ou "common" (qualquer conta Microsoft).',
    clientId: 'ID do cliente',
    clientSecret: 'Segredo do cliente',
    clientSecretInfo: 'Armazenado criptografado e nunca mais exibido: deixe vazio para manter o atual.',
    clientSecretSet: '(definido)',
    scopes: 'Escopos',
    scopesInfo: 'Separados por espaços; "openid" é obrigatório.',
    access: 'Acesso',
    accessDescription: 'Apenas os usuários que já têm uma conta ou um convite no Arena podem entrar.',
    allowedEmailDomains: 'Domínios de email permitidos',
    allowedEmailDomainsInfo:
      'Os usuários só podem entrar com um email destes domínios (por exemplo, o da sua organização).',
    emailDomainsMode: { all: 'Permitir todos os domínios de email', specific: 'Permitir apenas domínios específicos' },
    emailDomainsPlaceholder: 'Digite um domínio, por exemplo example.org',
    emailDomainsRequired: 'Adicione pelo menos um domínio de email ou permita todos os domínios de email',
    requireArena2FA: 'Exigir a autenticação de dois fatores do Arena',
    requireArena2FAInfo:
      'Os usuários que ativaram a 2FA do Arena ainda devem digitar o seu código. Desligue apenas se este fornecedor impuser a sua própria autenticação multifator.',
    trustEmail: 'Confiar nos emails deste fornecedor',
    trustEmailInfo:
      'Associar contas pelo email mesmo quando o fornecedor não confirma que o email foi verificado. Ligue apenas para fornecedores que verificam os emails eles mesmos.',
    redirectUri: 'URI de redirecionamento',
    redirectUriCopied: 'URI de redirecionamento copiado',
    setupStepsTitle: 'Como configurar o fornecedor',
    setupGuide: {
      google: 'Guia detalhado: Google',
      microsoft: 'Guia detalhado: Microsoft',
      oidc: 'Guia detalhado: Keycloak e outros fornecedores',
    },
    setupSteps: {
      google: [
        'No console do Google Cloud, abra Google Auth Platform (ou APIs & Services) > Clients e crie um cliente OAuth do tipo "Web application".',
        'Adicione o URI de redirecionamento acima aos "Authorized redirect URIs" do cliente.',
        'Copie o ID do cliente e o segredo do cliente criados pelo Google para os campos ID do cliente e Segredo do cliente da seção Conexão (à esquerda) e clique em Salvar.',
      ],
      microsoft: [
        'No centro de administração do Microsoft Entra, abra App registrations > New registration.',
        'Adicione o URI de redirecionamento acima como URI de redirecionamento "Web" da aplicação.',
        'Em Certificates & secrets, crie um novo segredo do cliente.',
        'Copie o Application (client) ID e o valor do segredo para os campos ID do cliente e Segredo do cliente da seção Conexão (à esquerda) e clique em Salvar.',
      ],
      oidc: [
        'No fornecedor (por exemplo, Keycloak, Okta), registre o Arena como aplicação web confidencial (OpenID Connect, fluxo authorization code).',
        'Adicione o URI de redirecionamento acima aos URIs de redirecionamento permitidos da aplicação e permita os escopos openid, email e profile.',
        'Copie a URL do emissor, o ID do cliente e o segredo do cliente da aplicação para os campos URL do emissor, ID do cliente e Segredo do cliente da seção Conexão (à esquerda) e clique em Salvar.',
      ],
    },
    loginPagePreview: 'Pré-visualização da página de login',
    readOnlyEnv:
      'Este fornecedor é definido na configuração do servidor (AUTH_PROVIDERS_CONFIG): altere-o lá e reinicie o Arena.',
    testConnection: 'Testar conexão',
    testSignIn: 'Testar início de sessão',
    testConnectionOk: 'Conexão OK: {{keysCount}} chaves de assinatura carregadas em {{durationMs}} ms.',
    testConnectionFailed: 'Falha na conexão: {{error}}',
  },
  testResult: {
    title: 'Resultado do teste de início de sessão',
    success: 'Início de sessão bem-sucedido: o ID token foi validado. Ninguém entrou na sessão e nada foi alterado.',
    issuer: 'Emissor',
    subject: 'Sujeito (sub)',
    email: 'Email',
    verified: '(verificado)',
    notVerified: '(não verificado)',
    name: 'Nome',
    matchingUser: 'Usuário do Arena correspondente',
    outcome: 'No início de sessão',
    alreadyLinked: 'Já associado: o usuário entraria na sessão.',
    wouldLink: 'A conta seria associada ao usuário pelo email.',
  },
}
