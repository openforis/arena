export default {
  authenticatorCodeOne: 'Codigo de autenticador 1',
  authenticatorCodeTwo: 'Codigo de autenticador 2',
  authenticatorCodeTwoInfo: 'Espera 30 segundos e ingresa un segundo código',
  create: {
    label: 'Crear',
  },
  deletion: {
    confirm: 'Estas seguro de que deseas eliminar el dispositivo "{{deviceName}}"?',
    error: 'Error al eliminar el dispositivo: {{message}}',
    successful: 'Dispositivo eliminado correctamente',
  },
  deviceName: 'Nombre del dispositivo',
  enabled: 'Habilitado',
  error: {
    fetchDevice: 'Error al obtener detalles del dispositivo: {{message}}',
    createDevice: 'Error al crear el dispositivo: {{message}}',
    updateDevice: 'Error al actualizar el dispositivo: {{message}}',
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
