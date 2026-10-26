export default {
  loginView: {
    yourName: 'Su nombre',
    yourEmail: 'Su correo electrónico',
    yourPassword: 'Su contraseña',
    yourNewPassword: 'Su nueva contraseña',
    repeatYourPassword: 'Repita su contraseña',
    repeatYourNewPassword: 'Repita su nueva contraseña',
    requestAccess: '¿Nuevo en $t(common.appNameFull)? Solicitar acceso',
    resetPassword: 'Restablecer contraseña',
    login: 'Iniciar sesión',
    loginUsingBackupCode: 'Iniciar sesion con codigo de respaldo 2FA',
    forgotPassword: '¿Olvidó su contraseña?',
    sendPasswordResetEmail: 'Enviar correo electrónico de restablecimiento de contraseña',
    twoFactorBackupCode: 'Codigo de respaldo 2FA',
    twoFactorToken: 'Código de verificación',
    twoFactorTokenDescription: `Para mantener su cuenta segura, verificamos su identidad.

  Ingrese el código generado por su aplicación de autenticación.`,
  },
  accessRequestView: {
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
      'Nuestros recursos son limitados, por lo que debe solicitar acceso a la plataforma. También nos interesa saber qué desea hacer con ella, ¡así que háganoslo saber! Tiene la posibilidad de empezar desde una **nueva encuesta en blanco** o clonar una **plantilla** existente y tendrá que sugerir un nombre para la nueva encuesta creada. Se le asignará el rol de ***Administrador de encuestas*** para esa encuesta: podrá editarla e invitar a nuevos usuarios a unirse a su encuesta y contribuir a ella. También será un ***Gerente de encuestas*** y podrá **crear nuevas encuestas** (hasta 5) si es necesario. Para obtener más información, visite nuestro sitio web: $t(links.openforisArenaWebsite) $t(common.raiseTicketInSupportForum) **Una vez que envíe la solicitud, espere un correo electrónico de invitación para acceder a Arena.**',
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
    title: 'Solicitando acceso a $t(common.appNameFull)',
    whitelistSenderSuggestion:
      'Si lo encuentra en la carpeta de Spam/Correo no deseado, añada **{{senderEmail}}** a sus contactos (libreta de direcciones) o márquelo como seguro/no es spam, para que nuestros próximos correos lleguen directamente a su bandeja de entrada.',
  },
  resetPasswordView: {
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
}
