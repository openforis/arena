export default {
  loginView: {
    title: 'Iniciar sesión',
    subtitle: '¡Bienvenido! Introduzca sus credenciales para acceder a $t(common.appNameFull).',
    backToLogin: 'Volver al inicio de sesión',
    noAccountYet: '¿Aún no tiene una cuenta?',
    createAccount: 'Crear una cuenta',
    invitedToSurvey:
      '¿Le han invitado a una encuesta? No necesita crear una cuenta: abra el enlace del correo de invitación y siga sus pasos.',
    or: 'o',
    twoFactorTitle: 'Verificación en dos pasos',
    verify: 'Verificar',
    lostYourDevice: '¿No puede usar su aplicación de autenticación?',
    yourName: 'Su nombre',
    yourEmail: 'Su correo electrónico',
    email: '$t(common.email)',
    password: 'Contraseña',
    repeatPassword: 'Repetir contraseña',
    yourNewPassword: 'Su nueva contraseña',
    repeatYourNewPassword: 'Repita su nueva contraseña',
    requestAccess: 'Solicitar acceso',
    resetPassword: 'Restablecer contraseña',
    login: 'Iniciar sesión',
    loginUsingBackupCode: 'Usar un código de respaldo',
    forgotPassword: '¿Olvidó su contraseña?',
    sendPasswordResetEmail: 'Enviar correo electrónico de restablecimiento de contraseña',
    twoFactorBackupCode: 'Codigo de respaldo 2FA',
    twoFactorToken: 'Código de verificación',
    twoFactorTokenDescription: `Para mantener su cuenta segura, verificamos su identidad.

  Ingrese el código generado por su aplicación de autenticación.`,
  },
  externalLogin: {
    signInWith: 'Iniciar sesión con {{provider}}',
    continueWith: 'Continuar con {{provider}}',
    registeredUsersOnly: 'Solo usuarios registrados',
    errors: {
      providerNotAvailable:
        'Esta opción de inicio de sesión no está disponible. Inténtelo más tarde o inicie sesión con su correo electrónico y contraseña.',
      flowInvalid: 'El inicio de sesión ha caducado o se inició en otro navegador. Inténtelo de nuevo.',
      providerError: 'El inicio de sesión con el proveedor externo ha fallado. Inténtelo de nuevo.',
      emailNotVerified:
        'El proveedor no confirmó su dirección de correo electrónico, por lo que no se puede asociar a una cuenta. Inicie sesión con su contraseña y vincule el proveedor desde su perfil.',
      emailDomainNotAllowed:
        'Las cuentas con este dominio de correo electrónico no pueden usar esta opción de inicio de sesión.',
      userNotFound:
        'No existe ninguna cuenta con esta dirección de correo electrónico. Pida una invitación a un administrador de la encuesta o solicite acceso.',
      userNotFoundCreateAccount:
        'No existe ninguna cuenta con esta dirección de correo electrónico. Cree primero una cuenta o pida una invitación a un administrador de la encuesta.',
      ambiguousEmail:
        'Más de una cuenta corresponde a esta dirección de correo electrónico. Inicie sesión con su contraseña y vincule el proveedor desde su perfil.',
      identityAlreadyLinked: 'Esta cuenta del proveedor ya está vinculada a otro usuario.',
      providerAlreadyLinked:
        'Otra cuenta de este proveedor ya está vinculada a su usuario: desvincúlela primero desde su perfil.',
      invitationInvalid: 'La invitación no es válida o ha caducado. Pida una nueva al administrador de la encuesta.',
      invalidTwoFactorCode: 'Código de verificación no válido.',
    },
  },
  accessRequestView: {
    whatHappensNext: '¿Qué sucede después?',
    alreadyHaveAnAccount: '¿Ya tiene una cuenta?',
    steps: {
      sendRequest: {
        title: 'Envíe la solicitud',
        description:
          'Sugiera un nombre para su primera encuesta: empiece con una encuesta en blanco o desde una plantilla.',
      },
      review: { title: 'La revisamos', description: 'Por favor, denos un par de días para procesar su solicitud.' },
      invitation: {
        title: 'Reciba su invitación',
        description:
          'Recibirá un correo electrónico de **{{senderEmail}}** con el enlace para acceder a $t(common.appName). ¿No está en su bandeja de entrada? Revise la carpeta de correo no deseado (Spam) y luego añada el remitente a sus contactos o marque el correo como deseado.',
        descriptionWithoutSender:
          'Recibirá un correo electrónico con el enlace para acceder a $t(common.appName). ¿No está en su bandeja de entrada? Revise la carpeta de correo no deseado (Spam) y luego añada el remitente a sus contactos o marque el correo como deseado.',
      },
      startWorking: {
        title: 'Empiece a trabajar',
        description: 'Será Administrador de la nueva encuesta y podrá crear hasta 5 encuestas.',
      },
    },
    error: 'Error al solicitar acceso: {{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        title: '$t(user.title)',
        firstName: 'Nombre',
        lastName: 'Apellido',
        institution: 'Institución',
        country: 'País',
        purpose: '¿Para qué lo necesita?',
        surveyName: 'Proponer un nombre de encuesta',
        templateUuid: '¿Empezar desde una plantilla?',
      },
    },
    introduction:
      'Nuestros recursos son limitados, por lo que el acceso se concede previa solicitud. ¡Cuéntenos qué quiere hacer con $t(common.appName)!',
    reCaptchaNotAnswered: 'ReCaptcha no respondido',
    requestSent: 'Solicitud de acceso enviada correctamente',
    requestSentMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Por favor, concédanos un par de días para procesar su solicitud.
Una vez aceptada, le enviaremos otro correo electrónico a **{{email}}** con las instrucciones sobre cómo acceder a $t(common.appName).
¡Gracias y disfrute de **$t(common.appNameFull)**!`,
    surveyNameHint:
      'El nombre identifica la encuesta en toda la plataforma $t(common.appName) y debe ser **único**: elija un nombre específico, p. ej., combinando su organización o país, el proyecto y el año, no uno genérico como "survey" o "test". Solo letras minúsculas, números y guiones bajos.',
    sendRequest: 'Enviar solicitud',
    sendRequestConfirm: '¿Solicitar acceso a $t(common.appNameFull)?',
    templateNotSelected: 'No seleccionado (empezar desde cero)',
    title: 'Solicitar acceso',
    whitelistSenderSuggestion:
      'Si lo encuentra en la carpeta de Spam/Correo no deseado, añada **{{senderEmail}}** a sus contactos (libreta de direcciones) o márquelo como seguro/no es spam, para que nuestros próximos correos lleguen directamente a su bandeja de entrada.',
  },
  registrationView: {
    title: 'Crear una cuenta',
    introduction: 'Cree su cuenta y su primera encuesta: ¡cuéntenos qué quiere hacer con $t(common.appName)!',
    createAccount: 'Crear cuenta',
    createAccountConfirm: '¿Crear su cuenta en $t(common.appNameFull)?',
    accountCreated: 'Cuenta creada',
    accountCreatedMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Abra el enlace del correo para confirmar su dirección de correo electrónico y completar el registro: elija su contraseña o inicie sesión con una de las opciones de inicio de sesión disponibles (p. ej., Google).

¡Gracias y disfrute de **$t(common.appNameFull)**!`,
    error: 'Error al crear la cuenta: {{error}}',
    steps: {
      createAccount: {
        title: 'Cree su cuenta',
        description: '$t(guest:accessRequestView.steps.sendRequest.description)',
      },
      confirmEmail: {
        title: 'Confirme su correo',
        description:
          'Recibirá un correo de **{{senderEmail}}** con el enlace para completar su registro. ¿No está en su bandeja de entrada? Revise la carpeta de spam/correo no deseado y, después, añada el remitente a sus contactos o marque el correo como no spam.',
        descriptionWithoutSender:
          'Recibirá un correo con el enlace para completar su registro. ¿No está en su bandeja de entrada? Revise la carpeta de spam/correo no deseado y, después, añada el remitente a sus contactos o marque el correo como no spam.',
      },
      startWorking: {
        title: '$t(guest:accessRequestView.steps.startWorking.title)',
        description: '$t(guest:accessRequestView.steps.startWorking.description)',
      },
    },
  },
  resetPasswordView: {
    description: {
      completeRegistration: 'Configure su cuenta para empezar.',
      setYourNewPassword: 'Elija una nueva contraseña para su cuenta.',
    },
    title: {
      completeRegistration: 'Complete su registro en Arena',
      setYourNewPassword: 'Establezca su nueva contraseña',
    },
    setNewPassword: 'Establecer nueva contraseña',
    forgotPasswordLinkInvalid: 'La página a la que ha intentado acceder no existe o ya no es válida',
    passwordSuccessfullyReset: 'Su contraseña ha sido restablecida correctamente',
    passwordStrengthChecksTitle: 'Verificaciones de seguridad de la contraseña',
    passwordStrengthChecks: {
      noWhiteSpaces: 'Sin espacios en blanco',
      atLeast8CharactersLong: 'Al menos 8 caracteres',
      containsLowerCaseLetters: 'Contiene letras minúsculas',
      containsUpperCaseLetters: 'Contiene letras mayúsculas',
      containsNumbers: 'Contiene números',
    },
    completeRegistration: 'Completar registro',
    completeRegistrationWith: 'Completar el registro con {{provider}}',
    definePassword: 'Definir una contraseña',
  },
  forgotPasswordView: {
    title: 'Restablecer su contraseña',
    description:
      'Introduzca el correo electrónico de su cuenta y le enviaremos un enlace para elegir una nueva contraseña.',
    emailSent: `Si existe una cuenta para {{email}}, recibirá un correo electrónico con un enlace para restablecer su contraseña.

Por favor, revise también la carpeta de correo no deseado/spam.`,
  },
  pitch: {
    default: {
      title: 'Datos de campo, de la recolección al análisis.',
      description:
        'Diseñe formularios multilingües, gestione inventarios de varios ciclos, valide la calidad de los datos y analice los resultados con RStudio integrado.',
    },
    accessRequest: {
      title: 'Cree su primera encuesta en $t(common.appName).',
    },
    tags: {
      forestInventories: 'Inventarios forestales',
      questionnaires: 'Cuestionarios',
      multiCycle: 'Varios ciclos',
      statisticalAnalysis: 'Análisis estadístico',
    },
  },
  footer: {
    website: 'Acerca de $t(common.appName)',
    userManual: 'Manual de usuario',
    supportForum: 'Foro de soporte',
    version: 'Versión {{version}}',
  },
}
