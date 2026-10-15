export default {
  section: 'AI features',
  featuresDisabled: 'AI features are disabled on this deployment.',
  encryptionMissing:
    'The deployment is missing AI_USER_KEY_ENCRYPTION_SECRET; personal API keys cannot be saved until an administrator configures it.',

  model: 'Model',
  modelOther: 'Other (type a model id)...',
  baseUrl: 'Base URL',
  apiKey: 'API key',
  apiKeyPlaceholder: 'Paste your provider API key',
  apiKeySaved: 'Key saved',
  apiKeyKept: 'Leave blank to keep the existing key.',
  apiKeyUnreadable:
    'The saved API key can no longer be read (the server encryption secret changed). Enter the key again.',
  vercelAiSdkHint:
    'A Vercel AI SDK chat endpoint is treated as a fixed agent - model selection and API key do not apply. Free-text generation works; structured-output features may not.',
  modelsFetchFailed: 'Could not fetch models: {{message}}',

  savedSuccessfully: 'AI settings saved.',
  saveFailed: 'Failed to save AI settings: {{message}}',

  status: {
    ready: 'Ready',
    notTested: 'Not tested',
    notAvailable: 'Not available',
    notSetUp: 'Not set up',
  },
  where: {
    onDevice: 'This computer',
    orgHosted: 'Organisation server',
    cloudOwnKey: 'Cloud · your key',
    cloud: 'Cloud',
  },
  localServer: {
    where: 'On this computer or your network',
    baseUrl: 'Server URL',
    answered: 'Answered',
    noModels: 'The server lists no model. Load a model in your local server.',
    contextTokens: 'Context: {{count}} tokens',
    contextUnknown: 'Context: unknown (8,192 tokens assumed)',
    model: 'Model',
    modelPlaceholder: 'Test the connection to list the models',
    help: 'Start your local server (for example LM Studio or Ollama) and allow requests from this site (CORS). Your browser may ask to allow access to local network devices.',
    httpsHint:
      'Arena is served over HTTPS: a server on another machine of your network needs HTTPS, or a browser with Local Network Access (Chrome) and your permission.',
    cloudWarning:
      "This address is neither on this device nor on the organisation's list of servers: the survey AI policy treats it as a cloud service.",
    notSaved: 'The local AI server settings could not be saved in this browser (storage blocked or full).',
  },
  list: {
    section: 'Providers',
    add: 'Add provider',
    arenaDefault: 'Arena default',
    default: 'Default',
    defaultMissing:
      'Your default provider is a Local server saved in another browser. Make another provider the default to use AI here.',
    footerHint: 'Providers save when you add them. What AI can see saves with Save.',
    menu: 'Actions for {{name}}',
    makeDefault: 'Make default',
    test: 'Test connection',
    edit: 'Edit…',
    remove: 'Remove',
    removeConfirm: 'Remove {{name}}? Conversations that use it will use your default.',
    removed: '{{name}} was removed.',
    defaultChanged: '{{name}} is now your default.',
    testOk: '{{name}} answered.',
    testFailed: '{{name}} did not answer. Edit it to check its settings.',
    actionFailed: 'The change could not be saved: {{message}}',
  },
  types: {
    local: 'Local server',
    orgServer: 'Organisation server',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'OpenAI-compatible',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Mock (test server)',
  },
  typeHints: {
    orgServer: "An OpenAI-compatible server on your organisation's list.",
    'openai-compatible': 'Azure, OpenRouter, …',
    'vercel-ai-sdk': 'A chat endpoint built with the Vercel AI SDK.',
  },
  dialog: {
    addTitle: 'Add an AI provider',
    editTitle: 'Edit {{name}}',
    groupLocal: 'On your computer or network',
    groupCloud: 'Cloud, with your API key',
    back: 'Back',
    name: 'Name (optional)',
    test: 'Test',
    testOk: 'Answered in {{latencyMs}} ms',
    add: 'Add provider',
    save: 'Save',
    testFirst: 'Test the connection before saving.',
    orgServerHint: "Servers on your organisation's list: {{urls}}",
    orgServerNotAllowed: "This address is not on your organisation's list of servers.",
    apiKeyCleared: 'The address changed: enter the API key again.',
    localUrlHint:
      "This address is on your computer or your network: the Arena server can't reach it. Add it as a Local server instead.",
    useLocalServer: 'Add a Local server',
  },
  dataClasses: {
    none: 'No survey content',
    schema: 'Survey design',
    data: 'Record data',
  },
  access: {
    section: 'What AI can see',
    levels: {
      off: 'Off',
      help: 'Help only',
      design: '+ Survey design',
      data: '+ Record data',
    },
    classes: {
      help: { title: 'Arena help', text: 'Your question and passages from the Arena user manual.' },
      design: {
        title: 'Survey design',
        text: 'Entities, attributes, labels, categories and expressions. No record values.',
      },
      data: {
        title: 'Record data',
        text: 'Record values and query results. By default, only a server on this device may receive them.',
      },
    },
    count: '{{on}} of {{total}} features on',
    off: 'AI features are off',
    customize: 'Customize',
    customizeHint: "Each survey's AI policy can still block a provider.",
    sendsInfo: 'What it sends',
  },
  features: {
    chat: {
      label: 'Help assistant',
      sends: 'Your question, passages from the Arena user manual and where you are in Arena (the module name).',
    },
    assistantSuggestions: {
      label: 'Proactive suggestions',
      sends: 'Nothing until you click Do it on a suggestion. The checks run in your browser.',
    },
    expressions: {
      label: 'Expressions',
      sends:
        'The attribute and its sibling attributes (names and types), the expression and your description. If it retries or explains an error, also the failed expression and its error message.',
    },
    translation: {
      label: 'Label translation',
      sends:
        "The label or description you translate, with the language codes. 'AI: Translate labels' in the Form Designer sends the labels and descriptions of all entities and attributes.",
    },
    assistantDesign: {
      label: 'Design assistant',
      sends: 'The survey structure it asks for: entities, attributes, labels, categories and expressions.',
    },
    dataQuery: {
      label: 'Data queries',
      sends:
        "The attribute names, types and labels of the survey's entities, category names, your description and, for a summary, the query with its filter. No record values.",
    },
    dataDictionary: {
      label: 'Data dictionary',
      sends:
        'The survey name and, for each entity or attribute without a description, its name, type and parent entities.',
    },
    assistantAnalysis: {
      label: 'Analysis assistant',
      sends:
        'The survey structure, then record counts and query results (up to 200 groups or 50 rows) whenever it runs a query.',
    },
    assistantCleaning: {
      label: 'Cleaning assistant',
      sends:
        'The survey structure, validation errors with their record keys and values, the values of the records it looks at and, when it runs a query, its results (record counts and up to 200 groups or 50 rows). It proposes edits that you review.',
    },
    userActivity: {
      label: 'Activity summaries',
      sends: 'The survey name, user names, activity types, counts and dates from the activity log.',
    },
  },
}
