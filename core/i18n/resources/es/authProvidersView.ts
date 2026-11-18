export default {
  title: 'Proveedores de inicio de sesión',
  subtitle:
    'Opciones externas de inicio de sesión que se muestran en la página de inicio de sesión, en este orden. Los usuarios también pueden iniciar sesión con correo electrónico y contraseña.',
  previewLoginPage: 'Vista previa de la página de inicio de sesión',
  addProvider: 'Añadir proveedor',
  continue: 'Continuar',
  encryptionKeyMissing:
    'La clave de cifrado de los secretos de cliente no está configurada: establezca AUTH_PROVIDER_SECRET_ENCRYPTION_KEY (64 caracteres hexadecimales) en el servidor y reinicie Arena para añadir proveedores.',
  empty: {
    title: 'Todavía no hay proveedores de inicio de sesión',
    description:
      'Permita que los usuarios inicien sesión con Google, Microsoft o el inicio de sesión único de su organización, además de con correo electrónico y contraseña.',
  },
  columns: {
    provider: 'Proveedor',
    type: 'Tipo',
    status: 'Estado',
    loginPage: 'Página de inicio de sesión',
    linkedUsers: 'Usuarios vinculados',
    actions: 'Acciones',
  },
  passwordAlwaysAvailable:
    'El inicio de sesión con correo electrónico y contraseña siempre está disponible. Los cambios llegan a todas las instancias del servidor en un minuto.',
  status: {
    enabled: 'Activado',
    disabled: 'Desactivado',
  },
  source: {
    env: 'configuración del servidor',
  },
  types: {
    google: 'Google',
    microsoft: 'Microsoft',
    oidc: 'OpenID Connect',
  },
  loginPage: {
    shown: 'Visible',
    directLinkOnly: 'Solo enlace directo',
  },
  moveUp: 'Subir',
  moveDown: 'Bajar',
  enable: 'Activar',
  disable: 'Desactivar',
  deleteConfirm:
    '¿Eliminar el proveedor de inicio de sesión "{{provider}}"? Se eliminarán los vínculos de sus {{linkedUsersCount}} usuarios (para impedir los inicios de sesión pero conservar los vínculos, desactívelo).\n\nUsuarios que se quedarán sin ningún método de inicio de sesión (recibirán un correo explicando cómo establecer una contraseña): {{usersWithoutOtherMethod}}',
  addDialog: {
    description: 'Elija el tipo de proveedor. Puede cambiar la etiqueta y el icono después.',
    typeDescription: {
      google: 'Cuentas de Google, incluidas Gmail y Google Workspace.',
      microsoft: 'Cuentas de Microsoft profesionales, educativas o personales (Entra ID).',
      oidc: 'Cualquier otro proveedor: Keycloak, Okta, Auth0, el SSO de su organización...',
    },
    notSupportedYet: 'Facebook, GitHub y Apple todavía no son compatibles.',
  },
  form: {
    errors: 'No se puede guardar el proveedor: {{errors}}',
    newTitle: 'Nuevo proveedor {{type}}',
    general: 'General',
    label: 'Etiqueta del botón',
    id: 'Identificador',
    idInfo:
      'Se usa en las URL y para vincular las cuentas de usuario: letras minúsculas, dígitos y guiones. No se puede cambiar después de crearlo.',
    icon: 'Icono',
    useUploadedIcon: 'Usar el icono subido',
    iconInvalid: 'Icono no válido: use un archivo PNG o SVG de hasta 100 KB.',
    enabled: 'Activado',
    enabledInfo:
      'Si está desactivado, el botón se oculta y se rechazan los inicios de sesión con este proveedor. Las cuentas vinculadas se conservan.',
    showOnLoginPage: 'Mostrar en la página de inicio de sesión',
    showOnLoginPageInfo: 'Si está desactivado, solo se puede acceder al proveedor con el enlace directo {{path}}',
    connection: 'Conexión',
    issuer: 'URL del emisor',
    issuerInfo: 'Arena lee los demás endpoints de <emisor>/.well-known/openid-configuration.',
    tenant: 'Inquilino',
    tenantInfo:
      'ID de inquilino de su organización, o "organizations" (cualquier cuenta profesional o educativa), "consumers" (cuentas personales) o "common" (cualquier cuenta de Microsoft).',
    clientId: 'ID de cliente',
    clientSecret: 'Secreto de cliente',
    clientSecretInfo: 'Se guarda cifrado y no se vuelve a mostrar: déjelo vacío para conservar el actual.',
    clientSecretSet: '(establecido)',
    scopes: 'Ámbitos',
    scopesInfo: 'Separados por espacios; "openid" es obligatorio.',
    access: 'Acceso',
    accessDescription: 'Solo pueden iniciar sesión los usuarios que ya tienen una cuenta o una invitación de Arena.',
    allowedEmailDomains: 'Dominios de correo permitidos',
    allowedEmailDomainsInfo: 'Separados por comas; cualquier dominio si está vacío.',
    requireArena2FA: 'Exigir la autenticación en dos pasos de Arena',
    requireArena2FAInfo:
      'Los usuarios que activaron la autenticación en dos pasos de Arena deben seguir introduciendo su código. Desactívelo solo si este proveedor exige su propia autenticación multifactor.',
    trustEmail: 'Confiar en los correos de este proveedor',
    trustEmailInfo:
      'Vincular las cuentas por correo electrónico aunque el proveedor no confirme que el correo está verificado. Actívelo solo para proveedores que verifican ellos mismos los correos.',
    redirectUri: 'URI de redirección',
    redirectUriCopied: 'URI de redirección copiado',
    setupStepsTitle: 'Cómo configurar el proveedor',
    setupSteps: {
      google: [
        'En Google Cloud console, abra Google Auth Platform (o APIs y servicios) > Clientes y cree un cliente OAuth de tipo "Aplicación web".',
        'Añada el URI de redirección anterior a los "URI de redireccionamiento autorizados" del cliente.',
        'Copie el ID de cliente y el secreto de cliente creados por Google en los campos ID de cliente y Secreto de cliente de la sección Conexión (a la izquierda) y haga clic en Guardar.',
      ],
      microsoft: [
        'En el centro de administración de Microsoft Entra, abra Registros de aplicaciones > Nuevo registro.',
        'Añada el URI de redirección anterior como URI de redirección "Web" de la aplicación.',
        'En Certificados y secretos, cree un nuevo secreto de cliente.',
        'Copie el Id. de aplicación (cliente) y el valor del secreto en los campos ID de cliente y Secreto de cliente de la sección Conexión (a la izquierda) y haga clic en Guardar.',
      ],
      oidc: [
        'En el proveedor (p. ej. Keycloak, Okta), registre Arena como aplicación web confidencial (OpenID Connect, flujo de código de autorización).',
        'Añada el URI de redirección anterior a los URI de redirección permitidos de la aplicación y permita los ámbitos openid, email y profile.',
        'Copie la URL del emisor, el ID de cliente y el secreto de cliente de la aplicación en los campos URL del emisor, ID de cliente y Secreto de cliente de la sección Conexión (a la izquierda) y haga clic en Guardar.',
      ],
    },
    loginPagePreview: 'Vista previa de la página de inicio de sesión',
    readOnlyEnv:
      'Este proveedor está definido en la configuración del servidor (AUTH_PROVIDERS_CONFIG): modifíquelo allí y reinicie Arena.',
    testConnection: 'Probar la conexión',
    testSignIn: 'Probar el inicio de sesión',
    testConnectionOk: 'Conexión correcta: {{keysCount}} claves de firma cargadas en {{durationMs}} ms.',
    testConnectionFailed: 'La conexión ha fallado: {{error}}',
  },
  testResult: {
    title: 'Resultado de la prueba de inicio de sesión',
    success: 'Inicio de sesión correcto: se validó el token de ID. No se inició ninguna sesión ni se modificó nada.',
    issuer: 'Emisor',
    subject: 'Sujeto (sub)',
    email: 'Correo electrónico',
    verified: '(verificado)',
    notVerified: '(no verificado)',
    name: 'Nombre',
    matchingUser: 'Usuario de Arena correspondiente',
    outcome: 'Al iniciar sesión',
    alreadyLinked: 'Ya vinculado: el usuario iniciaría sesión.',
    wouldLink: 'La cuenta se vincularía al usuario por correo electrónico.',
  },
}
