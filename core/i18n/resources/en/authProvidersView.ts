export default {
  title: 'Login providers',
  subtitle:
    'External sign-in options shown on the login page, in this order. Users can also sign in with email and password.',
  previewLoginPage: 'Preview login page',
  addProvider: 'Add provider',
  continue: 'Continue',
  encryptionKeyMissing:
    'The encryption key of the client secrets is not configured: set AUTH_PROVIDER_SECRET_ENCRYPTION_KEY (64 hexadecimal characters) on the server and restart Arena to add providers.',
  empty: {
    title: 'No login providers yet',
    description:
      "Let users sign in with Google, Microsoft or your organization's single sign-on, in addition to email and password.",
  },
  columns: {
    provider: 'Provider',
    type: 'Type',
    status: 'Status',
    loginPage: 'Login page',
    linkedUsers: 'Linked users',
    actions: 'Actions',
  },
  passwordAlwaysAvailable:
    'Email and password sign-in is always available. Changes reach every server instance within a minute.',
  status: {
    enabled: 'Enabled',
    disabled: 'Disabled',
  },
  source: {
    env: 'server configuration',
  },
  types: {
    google: 'Google',
    microsoft: 'Microsoft',
    oidc: 'OpenID Connect',
  },
  loginPage: {
    shown: 'Shown',
    directLinkOnly: 'Direct link only',
  },
  moveUp: 'Move up',
  moveDown: 'Move down',
  enable: 'Enable',
  disable: 'Disable',
  deleteConfirm:
    'Delete the login provider "{{provider}}"? The links of its {{linkedUsersCount}} users will be removed (to stop sign-ins but keep the links, disable it instead).\n\nUsers left without any sign-in method (they will receive an email explaining how to set a password): {{usersWithoutOtherMethod}}',
  addDialog: {
    description: 'Choose the kind of provider. You can change the label and icon afterwards.',
    typeDescription: {
      google: 'Google accounts, including Gmail and Google Workspace.',
      microsoft: 'Work, school or personal Microsoft accounts (Entra ID).',
      oidc: "Any other provider: Keycloak, Okta, Auth0, your organization's SSO...",
    },
    notSupportedYet: 'Facebook, GitHub and Apple are not supported yet.',
  },
  form: {
    errors: 'Cannot save the provider: {{errors}}',
    newTitle: 'New {{type}} provider',
    general: 'General',
    label: 'Button label',
    id: 'Identifier',
    idInfo:
      'Used in URLs and to link user accounts: lowercase letters, digits and hyphens. It cannot be changed after creation.',
    icon: 'Icon',
    useUploadedIcon: 'Use the uploaded icon',
    iconInvalid: 'Invalid icon: use a PNG or SVG file up to 100 KB.',
    enabled: 'Enabled',
    enabledInfo:
      'When disabled, the button is hidden and sign-ins with this provider are refused. Linked accounts are kept.',
    showOnLoginPage: 'Show on the login page',
    showOnLoginPageInfo: 'When off, the provider is reachable only with the direct link {{path}}',
    connection: 'Connection',
    issuer: 'Issuer URL',
    issuerInfo: 'Arena reads the other endpoints from <issuer>/.well-known/openid-configuration.',
    tenant: 'Tenant',
    tenantInfo:
      'Tenant ID of your organization, or "organizations" (any work or school account), "consumers" (personal accounts) or "common" (any Microsoft account).',
    clientId: 'Client ID',
    clientSecret: 'Client secret',
    clientSecretInfo: 'Stored encrypted and never shown again: leave empty to keep the current one.',
    clientSecretSet: '(set)',
    scopes: 'Scopes',
    scopesInfo: 'Separated by spaces; "openid" is required.',
    access: 'Access',
    accessDescription: 'Only users who already have an Arena account or invitation can sign in.',
    allowedEmailDomains: 'Allowed email domains',
    allowedEmailDomainsInfo: 'Separated by commas; any domain if empty.',
    requireArena2FA: 'Require Arena two-factor authentication',
    requireArena2FAInfo:
      'Users who enabled Arena 2FA must still enter their code. Turn off only if this provider enforces its own multi-factor authentication.',
    trustEmail: 'Trust emails from this provider',
    trustEmailInfo:
      'Link accounts by email even when the provider does not confirm that the email is verified. Turn on only for providers that verify emails themselves.',
    redirectUri: 'Redirect URI',
    redirectUriCopied: 'Redirect URI copied',
    setupStepsTitle: 'How to set up the provider',
    setupSteps: {
      google: [
        'In the Google Cloud console, open Google Auth Platform (or APIs & Services) > Clients and create an OAuth client of type "Web application".',
        'Add the redirect URI above to the "Authorized redirect URIs" of the client.',
        'Copy the client ID and client secret created by Google into the Client ID and Client secret fields of the Connection section (on the left), then click Save.',
      ],
      microsoft: [
        'In the Microsoft Entra admin center, open App registrations > New registration.',
        'Add the redirect URI above as a "Web" redirect URI of the application.',
        'In Certificates & secrets, create a new client secret.',
        'Copy the Application (client) ID and the value of the secret into the Client ID and Client secret fields of the Connection section (on the left), then click Save.',
      ],
      oidc: [
        'At the provider (e.g. Keycloak, Okta), register Arena as a confidential web application (OpenID Connect, authorization code flow).',
        'Add the redirect URI above to the allowed redirect URIs of the application, and allow the openid, email and profile scopes.',
        'Copy the issuer URL, client ID and client secret of the application into the Issuer URL, Client ID and Client secret fields of the Connection section (on the left), then click Save.',
      ],
    },
    loginPagePreview: 'Login page preview',
    readOnlyEnv:
      'This provider is defined in the server configuration (AUTH_PROVIDERS_CONFIG): change it there and restart Arena.',
    testConnection: 'Test connection',
    testSignIn: 'Test sign-in',
    testConnectionOk: 'Connection OK: {{keysCount}} signing keys loaded in {{durationMs}} ms.',
    testConnectionFailed: 'Connection failed: {{error}}',
  },
  testResult: {
    title: 'Test sign-in result',
    success: 'Sign-in succeeded: the ID token was validated. Nobody was logged in and nothing was changed.',
    issuer: 'Issuer',
    subject: 'Subject (sub)',
    email: 'Email',
    verified: '(verified)',
    notVerified: '(not verified)',
    name: 'Name',
    matchingUser: 'Matching Arena user',
    outcome: 'At sign-in',
    alreadyLinked: 'Already linked: the user would be logged in.',
    wouldLink: 'The account would be linked to the user by email.',
  },
}
