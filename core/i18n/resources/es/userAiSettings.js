export default {
  section: 'Funciones de IA',
  enableFeatures: 'Habilitar funciones de IA',
  featuresDisabled: 'Las funciones de IA están deshabilitadas en este despliegue.',
  encryptionMissing:
    'En el despliegue falta AI_USER_KEY_ENCRYPTION_SECRET; las claves API personales no se pueden guardar hasta que un administrador lo configure.',

  provider: 'Proveedor',
  providers: {
    default: 'Predeterminado de Arena',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'Compatible con OpenAI (Azure, OpenRouter, Ollama, ...)',
    'vercel-ai-sdk': 'Vercel AI SDK (endpoint de chat)',
  },
  model: 'Modelo',
  modelOther: 'Otro (escriba un id de modelo)...',
  baseUrl: 'URL base',
  apiKey: 'Clave API',
  apiKeyPlaceholder: 'Pegue la clave API de su proveedor',
  apiKeyKept: 'Deje en blanco para mantener la clave existente.',
  apiKeyUnreadable:
    'La clave API guardada ya no se puede leer (cambió el secreto de cifrado del servidor). Las funciones de IA usan el proveedor predeterminado hasta que vuelva a introducir la clave.',
  vercelAiSdkHint:
    'Un endpoint de chat de Vercel AI SDK se trata como un agente fijo: la selección de modelo y la clave API no aplican. La generación de texto libre funciona; las funciones de salida estructurada pueden no funcionar.',
  modelsFetchFailed: 'No se pudieron obtener modelos: {{message}}',

  savedSuccessfully: 'Configuración de IA guardada.',
  saveFailed: 'Error al guardar la configuración de IA: {{message}}',

  status: {
    now: 'Ahora:',
    ready: 'Listo',
    notTested: 'Sin probar',
    notAvailable: 'No disponible',
    none: 'Active el servidor local o elija un proveedor.',
  },
  where: {
    section: 'Dónde se ejecuta la IA',
    order: {
      title: 'Orden',
      localFirst: 'Usar primero el servidor local y el proveedor en la nube como alternativa',
      cloudFirst: 'Usar primero el proveedor en la nube',
      hint: 'La política de IA de cada encuesta puede bloquear un motor. Por defecto, los datos de los registros se quedan en este dispositivo.',
    },
  },
  localServer: {
    name: 'Servidor de IA local',
    where: 'LM Studio en este equipo · guardado en este navegador',
    use: 'Usar',
    baseUrl: 'URL del servidor',
    test: 'Probar',
    answered: 'Respondió',
    noModels: 'El servidor no lista ningún modelo. Cargue un modelo en LM Studio.',
    contextTokens: 'Contexto: {{count}} tokens',
    contextUnknown: 'Contexto: desconocido (se suponen 8.192 tokens)',
    model: 'Modelo',
    modelPlaceholder: 'Pruebe la conexión para listar los modelos',
    help: 'LM Studio: inicie el servidor y active Enable CORS. Su navegador puede pedir permiso para acceder a los dispositivos de la red local.',
    docsLink: 'Documentación de LM Studio',
    httpsHint:
      'Arena se sirve por HTTPS: un servidor en otro equipo de su red necesita HTTPS, o un navegador con Local Network Access (Chrome) y su permiso.',
    cloudWarning:
      'Esta dirección no está en este dispositivo ni en la lista de servidores de la organización: la política de IA de la encuesta la trata como un servicio en la nube.',
    notSaved:
      'La configuración del servidor de IA local no se pudo guardar en este navegador (almacenamiento bloqueado o lleno).',
  },
  cloud: {
    name: 'Proveedor en la nube',
    where: 'guardado con su cuenta',
    defaultHint: 'Usa el proveedor que configuró su administrador de Arena.',
    defaultNone: 'No hay ninguno configurado en este servidor.',
    localUrlHint:
      'Esta dirección está en su equipo o en su red. Para LM Studio, use el Servidor de IA local de arriba. El servidor de Arena no puede acceder a ella.',
    localUrlLink: 'Usar el Servidor de IA local',
    test: 'Probar',
    testOk: 'Respondió en {{latencyMs}} ms',
    remove: 'Quitar mi proveedor',
    removed: 'Se quitó su proveedor. Las funciones de IA usan el predeterminado de Arena.',
    removedNoDefault: 'Se quitó su proveedor.',
  },
  dataClasses: {
    none: 'Sin contenido de la encuesta',
    schema: 'Diseño de la encuesta',
    data: 'Datos de los registros',
  },
  features: {
    section: 'Con qué puede ayudar la IA y qué ve',
    keyHint:
      'Diseño de la encuesta y Datos de los registros corresponden a los dos ajustes de la política de IA de cada encuesta.',
    sendsLabel: 'Envía:',
    groupHints: {
      none: 'Cualquier motor.',
      cloud: 'Política predeterminada de la encuesta: cualquier motor, incluida la nube.',
      onDevice:
        'Política predeterminada de la encuesta: solo este dispositivo. Un motor en la nube requiere que el administrador de la encuesta lo permita.',
    },
    chat: {
      label: 'Asistente de ayuda',
      sends:
        'Su pregunta, pasajes del manual de usuario de Arena y dónde se encuentra en Arena (el nombre del módulo).',
    },
    expressions: {
      label: 'Expresiones',
      sends:
        'El atributo y sus atributos hermanos (nombres y tipos), la expresión y su descripción. Si reintenta o explica un error, también la expresión fallida y su mensaje de error.',
    },
    translation: {
      label: 'Traducción de etiquetas',
      sends: 'La etiqueta o descripción que traduce, con los códigos de idioma.',
    },
    assistantDesign: {
      label: 'Asistente de diseño',
      sends: 'La estructura de la encuesta que solicita: entidades, atributos, etiquetas, categorías y expresiones.',
    },
    dataQuery: {
      label: 'Consultas de datos',
      sends:
        'Los nombres, tipos y etiquetas de los atributos de las entidades de la encuesta, los nombres de las categorías, su descripción y, para un resumen, la consulta con su filtro. Ningún valor de los registros.',
    },
    dataDictionary: {
      label: 'Diccionario de datos',
      sends: 'El nombre de la encuesta y, de cada atributo sin descripción, su nombre, tipo y entidades superiores.',
      runs: 'Se ejecuta en el servidor de Arena, con su proveedor en la nube o el predeterminado de Arena; nunca en su servidor local.',
    },
    assistantAnalysis: {
      label: 'Asistente de análisis',
      sends:
        'La estructura de la encuesta y, cada vez que ejecuta una consulta, recuentos de registros y resultados de la consulta (hasta 200 grupos o 50 filas).',
    },
    assistantCleaning: {
      label: 'Asistente de limpieza',
      sends:
        'La estructura de la encuesta, los errores de validación con las claves y los valores de sus registros, los valores de los registros que consulta y, cuando ejecuta una consulta, sus resultados (recuentos de registros y hasta 200 grupos o 50 filas). Propone cambios que usted revisa.',
    },
    userActivity: {
      label: 'Resúmenes de actividad',
      sends:
        'El nombre de la encuesta, nombres de usuario, tipos de actividad, recuentos y fechas del registro de actividad.',
    },
  },
  footerNote: 'Toda la configuración de IA se guarda con el botón Guardar del perfil.',
}
