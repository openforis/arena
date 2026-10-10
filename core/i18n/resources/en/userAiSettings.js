export default {
  section: 'AI features',
  enableFeatures: 'Enable AI features',
  featuresDisabled: 'AI features are disabled on this deployment.',
  encryptionMissing:
    'The deployment is missing AI_USER_KEY_ENCRYPTION_SECRET; personal API keys cannot be saved until an administrator configures it.',

  provider: 'Provider',
  providers: {
    default: 'Arena default',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'OpenAI-compatible (Azure, OpenRouter, Ollama, ...)',
    'vercel-ai-sdk': 'Vercel AI SDK (chat endpoint)',
  },
  model: 'Model',
  modelOther: 'Other (type a model id)...',
  baseUrl: 'Base URL',
  apiKey: 'API key',
  apiKeyPlaceholder: 'Paste your provider API key',
  apiKeyKept: 'Leave blank to keep the existing key.',
  apiKeyUnreadable:
    'The saved API key can no longer be read (the server encryption secret changed). AI features use the default provider until you enter the key again.',
  vercelAiSdkHint:
    'A Vercel AI SDK chat endpoint is treated as a fixed agent - model selection and API key do not apply. Free-text generation works; structured-output features may not.',
  modelsFetchFailed: 'Could not fetch models: {{message}}',

  savedSuccessfully: 'AI settings saved.',
  saveFailed: 'Failed to save AI settings: {{message}}',

  status: {
    now: 'Now:',
    ready: 'Ready',
    notTested: 'Not tested',
    notAvailable: 'Not available',
    none: 'Turn on the local server or choose a provider.',
  },
  where: {
    section: 'Where AI runs',
    order: {
      title: 'Order',
      localFirst: 'Use the local server first, the cloud provider as fallback',
      cloudFirst: 'Use the cloud provider first',
      hint: "Each survey's AI policy can still block an engine. Record data stays on this device by default.",
    },
  },
  localServer: {
    name: 'Local AI server',
    where: 'LM Studio on this computer · saved in this browser',
    use: 'Use',
    baseUrl: 'Server URL',
    test: 'Test',
    answered: 'Answered',
    noModels: 'The server lists no model. Load a model in LM Studio.',
    contextTokens: 'Context: {{count}} tokens',
    contextUnknown: 'Context: unknown (8,192 tokens assumed)',
    model: 'Model',
    modelPlaceholder: 'Test the connection to list the models',
    help: 'LM Studio: start the server and turn on Enable CORS. Your browser may ask to allow access to local network devices.',
    docsLink: 'LM Studio documentation',
    httpsHint:
      'Arena is served over HTTPS: a server on another machine of your network needs HTTPS, or a browser with Local Network Access (Chrome) and your permission.',
    cloudWarning:
      "This address is neither on this device nor on the organisation's list of servers: the survey AI policy treats it as a cloud service.",
    notSaved: 'The local AI server settings could not be saved in this browser (storage blocked or full).',
  },
  cloud: {
    name: 'Cloud provider',
    where: 'saved with your account',
    defaultHint: 'Uses the provider your Arena administrator set up.',
    defaultNone: 'None is set up on this server.',
    localUrlHint:
      "This address is on your computer or your network. For LM Studio, use the Local AI server above. The Arena server can't reach it.",
    localUrlLink: 'Use the Local AI server',
    test: 'Test',
    testOk: 'Answered in {{latencyMs}} ms',
    remove: 'Remove my provider',
    removed: 'Your provider was removed. AI features use the Arena default.',
  },
  dataClasses: {
    none: 'No survey content',
    schema: 'Survey design',
    data: 'Record data',
  },
  features: {
    section: 'What AI can help with, and what it sees',
    keyHint: "Survey design and Record data match the two settings of each survey's AI policy.",
    sendsLabel: 'Sends:',
    groupHints: {
      none: 'Any engine.',
      cloud: 'Default survey policy: any engine, cloud included.',
      onDevice: 'Default survey policy: this device only. A cloud engine needs the survey admin to allow it.',
    },
    chat: {
      label: 'Help assistant',
      sends: 'Your question, passages from the Arena user manual and where you are in Arena (the module name).',
    },
    expressions: {
      label: 'Expressions',
      sends:
        'The attribute and its sibling attributes (names and types), the expression and your description. If it retries or explains an error, also the failed expression and its error message.',
    },
    translation: {
      label: 'Label translation',
      sends: 'The label or description you translate, with the language codes.',
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
      sends: 'The survey name and, for each attribute without a description, its name, type and parent entities.',
      runs: 'Runs on the Arena server, with your cloud provider or the Arena default; never on your local server.',
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
  footerNote: "All AI settings save with the profile's Save button.",
}
