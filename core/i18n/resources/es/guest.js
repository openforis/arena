export default {
  loginView: {
    title: 'Iniciar sesión',
    subtitle: '¡Bienvenido! Introduzca sus credenciales para acceder a $t(common.appNameFull).',
    backToLogin: 'Volver al inicio de sesión',
    newToArena: '¿Nuevo en $t(common.appNameFull)?',
    or: 'o',
    twoFactorTitle: 'Verificación en dos pasos',
    verify: 'Verificar',
    lostYourDevice: '¿No puede usar su aplicación de autenticación?',
    yourName: 'Su nombre',
    yourEmail: 'Su correo electrónico',
    yourPassword: 'Su contraseña',
    yourNewPassword: 'Su nueva contraseña',
    repeatYourPassword: 'Repita su contraseña',
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
  accessRequestView: {
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
          'Recibirá un correo electrónico para acceder a $t(common.appName): será Administrador de la nueva encuesta y podrá crear hasta 5 encuestas.',
      },
    },
    error: 'Error al solicitar acceso: {{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
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
    sendRequest: 'Enviar solicitud',
    sendRequestConfirm: '¿Solicitar acceso a $t(common.appNameFull)?',
    templateNotSelected: 'No seleccionado (empezar desde cero)',
    title: 'Solicitar acceso',
    whitelistSenderSuggestion:
      'Si lo encuentra en la carpeta de Spam/Correo no deseado, añada **{{senderEmail}}** a sus contactos (libreta de direcciones) o márquelo como seguro/no es spam, para que nuestros próximos correos lleguen directamente a su bandeja de entrada.',
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
  },
  forgotPasswordView: {
    title: 'Restablecer su contraseña',
    description:
      'Introduzca el correo electrónico de su cuenta y le enviaremos un enlace para elegir una nueva contraseña.',
  },
  pitch: {
    default: {
      title: 'Datos de campo, de la recolección al análisis.',
      description:
        'Diseñe formularios multilingües, gestione inventarios de varios ciclos, valide la calidad de los datos y analice los resultados con RStudio integrado.',
    },
    accessRequest: {
      title: 'Cree su primera encuesta en $t(common.appName).',
      description:
        'Cuéntenos sobre su proyecto. Una vez aprobado, podrá diseñar formularios, invitar a sus equipos de campo y analizar los datos en un solo lugar.',
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
