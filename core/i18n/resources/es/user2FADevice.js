export default {
  authenticatorCodeOne: 'Codigo de autenticador 1',
  authenticatorCodeTwo: 'Codigo de autenticador 2',
  authenticatorCodeTwoInfo: 'Espera 30 segundos e ingresa un segundo código',
  backupCodesRegenerated: {
    title: 'Codigos de respaldo regenerados correctamente',
    message: `Guarda los siguientes 8 codigos de respaldo en un lugar seguro:  
{{backupCodes}}  

Usalos para acceder a tu cuenta si pierdes acceso a tu dispositivo autenticador.  
**Cada codigo de respaldo solo se puede usar una vez**.  
Solo se pueden ver ahora, asi que asegurate de **guardarlos ahora**.`,
  },
  create: {
    label: 'Crear',
  },
  creationSuccessful: {
    title: 'Dispositivo 2FA creado correctamente',
    message: `El dispositivo 2FA "{{deviceName}}" ha sido creado.  
$t(user2FADevice:backupCodesRegenerated.message)`,
  },
  deletion: {
    confirm: 'Estas seguro de que deseas eliminar el dispositivo "{{deviceName}}"?',
    error: 'Error al eliminar el dispositivo: {{message}}',
    successful: 'Dispositivo eliminado correctamente',
  },
  deviceName: 'Nombre del dispositivo',
  deviceNameFinal: 'Nombre del dispositivo mostrado en la app de autenticacion',
  enabled: 'Habilitado',
  error: {
    fetchDevice: 'Error al obtener detalles del dispositivo: {{message}}',
    createDevice: 'Error al crear el dispositivo: {{message}}',
    updateDevice: 'Error al actualizar el dispositivo: {{message}}',
    regenerateBackupCodes: 'Error al regenerar codigos de respaldo: {{message}}',
  },
  regenerateBackupCodes: {
    label: 'Regenerar codigos de respaldo',
    confirm: `Estas seguro de que deseas regenerar los codigos de respaldo para el dispositivo "{{deviceName}}"?  
Los codigos de respaldo anteriores ya no funcionaran.`,
  },
  showSecretKey: 'Mostrar clave secreta',
  validation: {
    label: 'Validar',
    successful: 'Dispositivo validado correctamente',
    error: 'Codigos de autenticador invalidos',
  },
  validationSteps: {
    installAuthenticatorApp: {
      title: 'Instalar aplicacion de autenticacion',
      description:
        'Instala una aplicacion de autenticacion en tu dispositivo movil (p. ej., Google Authenticator, Authy, etc.).',
    },
    scanCode: {
      title: 'Escanear codigo QR',
      description: 'Usa la aplicacion de autenticacion para escanear el codigo QR.',
      descriptionAlternative: 'Alternativamente, puedes ingresar la clave secreta en la aplicacion de autenticacion.',
    },
    typeAuthenticatorCodes: {
      title: 'Escribir codigos de autenticador',
      description:
        'Introduce dos codigos consecutivos generados por la aplicacion de autenticacion para validar el dispositivo.',
    },
  },
}
