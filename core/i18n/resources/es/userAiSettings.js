export default {
  section: 'Funciones de IA',
  featuresDisabled: 'Las funciones de IA están deshabilitadas en este despliegue.',
  encryptionMissing:
    'En el despliegue falta AI_USER_KEY_ENCRYPTION_SECRET; las claves API personales no se pueden guardar hasta que un administrador lo configure.',

  model: 'Modelo',
  modelOther: 'Otro (escriba un id de modelo)...',
  baseUrl: 'URL base',
  apiKey: 'Clave API',
  apiKeyPlaceholder: 'Pegue la clave API de su proveedor',
  apiKeySaved: 'Clave guardada',
  apiKeyKept: 'Deje en blanco para mantener la clave existente.',
  apiKeyUnreadable:
    'La clave API guardada ya no se puede leer (cambió el secreto de cifrado del servidor). Introduzca la clave de nuevo.',
  vercelAiSdkHint:
    'Un endpoint de chat de Vercel AI SDK se trata como un agente fijo: la selección de modelo y la clave API no aplican. La generación de texto libre funciona; las funciones de salida estructurada pueden no funcionar.',
  modelsFetchFailed: 'No se pudieron obtener modelos: {{message}}',

  savedSuccessfully: 'Configuración de IA guardada.',
  saveFailed: 'Error al guardar la configuración de IA: {{message}}',

  status: {
    ready: 'Listo',
    notTested: 'Sin probar',
    notAvailable: 'No disponible',
    notSetUp: 'No configurado',
  },
  where: {
    onDevice: 'Este equipo',
    orgHosted: 'Servidor de la organización',
    cloudOwnKey: 'Nube · su clave',
    cloud: 'Nube',
  },
  localServer: {
    where: 'En este equipo o en su red',
    baseUrl: 'URL del servidor',
    answered: 'Respondió',
    noModels: 'El servidor no lista ningún modelo. Cargue un modelo en su servidor local.',
    contextTokens: 'Contexto: {{count}} tokens',
    contextUnknown: 'Contexto: desconocido (se suponen 8.192 tokens)',
    model: 'Modelo',
    modelPlaceholder: 'Pruebe la conexión para listar los modelos',
    help: 'Inicie su servidor local (por ejemplo LM Studio u Ollama) y permita las solicitudes de este sitio (CORS). Su navegador puede pedir permiso para acceder a los dispositivos de la red local.',
    httpsHint:
      'Arena se sirve por HTTPS: un servidor en otro equipo de su red necesita HTTPS, o un navegador con Local Network Access (Chrome) y su permiso.',
    cloudWarning:
      'Esta dirección no está en este dispositivo ni en la lista de servidores de la organización: la política de IA de la encuesta la trata como un servicio en la nube.',
    notSaved:
      'La configuración del servidor de IA local no se pudo guardar en este navegador (almacenamiento bloqueado o lleno).',
  },
  list: {
    section: 'Proveedores',
    add: 'Añadir proveedor',
    arenaDefault: 'Predeterminado de Arena',
    default: 'Predeterminado',
    defaultMissing:
      'Su proveedor predeterminado es un servidor local guardado en otro navegador. Elija otro proveedor predeterminado para usar la IA aquí.',
    footerHint: 'Los proveedores se guardan al añadirlos. Lo que la IA puede ver se guarda con Guardar.',
    menu: 'Acciones de {{name}}',
    makeDefault: 'Hacer predeterminado',
    test: 'Probar la conexión',
    edit: 'Editar…',
    remove: 'Eliminar',
    removeConfirm: '¿Eliminar {{name}}? Las conversaciones que lo usan usarán su proveedor predeterminado.',
    removed: '{{name}} se eliminó.',
    defaultChanged: '{{name}} es ahora su proveedor predeterminado.',
    testOk: '{{name}} respondió.',
    testFailed: '{{name}} no respondió. Edítelo para revisar su configuración.',
    actionFailed: 'No se pudo guardar el cambio: {{message}}',
  },
  types: {
    local: 'Servidor local',
    orgServer: 'Servidor de la organización',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'Compatible con OpenAI',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Simulado (servidor de pruebas)',
  },
  typeHints: {
    orgServer: 'Un servidor compatible con OpenAI de la lista de su organización.',
    'openai-compatible': 'Azure, OpenRouter, …',
    'vercel-ai-sdk': 'Un endpoint de chat creado con Vercel AI SDK.',
  },
  dialog: {
    addTitle: 'Añadir un proveedor de IA',
    editTitle: 'Editar {{name}}',
    groupLocal: 'En su equipo o su red',
    groupCloud: 'En la nube, con su clave API',
    back: 'Atrás',
    name: 'Nombre (opcional)',
    test: 'Probar',
    testOk: 'Respondió en {{latencyMs}} ms',
    add: 'Añadir proveedor',
    save: 'Guardar',
    testFirst: 'Pruebe la conexión antes de guardar.',
    orgServerHint: 'Servidores de la lista de su organización: {{urls}}',
    orgServerNotAllowed: 'Esta dirección no está en la lista de servidores de su organización.',
    apiKeyCleared: 'La dirección cambió: introduzca de nuevo la clave API.',
    localUrlHint:
      'Esta dirección está en su equipo o en su red: el servidor de Arena no puede acceder a ella. Añádala como servidor local.',
    useLocalServer: 'Añadir un servidor local',
  },
  dataClasses: {
    none: 'Sin contenido de la encuesta',
    schema: 'Diseño de la encuesta',
    data: 'Datos de los registros',
  },
  access: {
    section: 'Qué puede ver la IA',
    levels: {
      off: 'Desactivada',
      help: 'Solo ayuda',
      design: '+ Diseño de la encuesta',
      data: '+ Datos de los registros',
    },
    classes: {
      help: { title: 'Ayuda de Arena', text: 'Su pregunta y fragmentos del manual de usuario de Arena.' },
      design: {
        title: 'Diseño de la encuesta',
        text: 'Entidades, atributos, etiquetas, categorías y expresiones. Sin valores de registros.',
      },
      data: {
        title: 'Datos de los registros',
        text: 'Valores de registros y resultados de consultas. De forma predeterminada, solo un servidor en este dispositivo puede recibirlos.',
      },
    },
    count: '{{on}} de {{total}} funciones activadas',
    off: 'Las funciones de IA están desactivadas',
    customize: 'Personalizar',
    customizeHint: 'La política de IA de cada encuesta aún puede bloquear un proveedor.',
    sendsInfo: 'Qué envía',
  },
  features: {
    chat: {
      label: 'Asistente de ayuda',
      sends:
        'Su pregunta, pasajes del manual de usuario de Arena y dónde se encuentra en Arena (el nombre del módulo).',
    },
    assistantSuggestions: {
      label: 'Sugerencias proactivas',
      sends: 'Nada hasta que pulse Hacerlo en una sugerencia. Las comprobaciones se hacen en su navegador.',
    },
    expressions: {
      label: 'Expresiones',
      sends:
        'El atributo y sus atributos hermanos (nombres y tipos), la expresión y su descripción. Si reintenta o explica un error, también la expresión fallida y su mensaje de error.',
    },
    translation: {
      label: 'Traducción de etiquetas',
      sends:
        'La etiqueta o descripción que traduce, con los códigos de idioma. «IA: Traducir etiquetas» en el Diseñador de formularios envía las etiquetas y descripciones de todas las entidades y atributos.',
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
      sends:
        'El nombre de la encuesta y, de cada entidad o atributo sin descripción, su nombre, tipo y entidades superiores.',
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
}
