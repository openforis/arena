const environments = {
  development: 'development',
  production: 'production',
}

const dbUrl = process.env.DATABASE_URL
const regExDbUrl = /postgres:\/\/(\w+):(\w+)@([\w-.\d]+):(\d+)\/(\w+)/
const dbUrlMatch = dbUrl ? dbUrl.match(regExDbUrl) : null
const [pgUser, pgPassword, pgHost, pgPort, pgDatabase] = dbUrlMatch
  ? [dbUrlMatch[1], dbUrlMatch[2], dbUrlMatch[3], dbUrlMatch[4], dbUrlMatch[5]]
  : [process.env.PGUSER, process.env.PGPASSWORD, process.env.PGHOST, process.env.PGPORT, process.env.PGDATABASE]

const ENV = {
  arenaRoot: process.env.ARENA_ROOT,
  arenaDist: process.env.ARENA_DIST,
  arenaPort: process.env.ARENA_PORT || '9090',
  nodeEnv: process.env.NODE_ENV || environments.development,
  debug: Boolean(process.env.DEBUG),
  tempFolder: process.env.TEMP_FOLDER || '/tmp/arena_upload',
  buildReport: process.env.BUILD_REPORT === 'true',
  // APP VERSION
  applicationVersion: process.env.APPLICATION_VERSION,
  gitCommitHash: process.env.GIT_COMMIT_HASH,
  gitBranch: process.env.GIT_BRANCH,
  // DB
  dbUrl,
  pgUser,
  pgPassword,
  pgHost,
  pgPort,
  pgDatabase,
  pgSsl: process.env.PGSSL === 'true',
  migrateOnly: process.env.MIGRATE_ONLY === 'true',
  // EMAIL
  adminEmail: process.env.ADMIN_EMAIL,
  sendGridApiKey: process.env.SENDGRID_API_KEY,
  // ANALYSIS
  analysisOutputDir: process.env.ANALYSIS_OUTPUT_DIR,
  // SESSION
  sessionIdCookieSecret: process.env.SESSION_ID_COOKIE_SECRET,
  // SERVER
  useHttps: process.env.USE_HTTPS === 'true',
  // RStudio Server
  rStudioDownloadServerUrl: process.env.RSTUDIO_DOWNLOAD_SERVER_URL,
  rStudioServerUrl: process.env.RSTUDIO_SERVER_URL,
  rStudioPoolServerURL: process.env.RSTUDIO_POOL_SERVER_URL,
  rStudioPoolServiceKey: process.env.RSTUDIO_POOL_SERVICE_KEY,
}

module.exports = {
  ENV,
  isEnvDevelopment: ENV.nodeEnv === environments.development,
  isEnvProduction: ENV.nodeEnv === environments.production,
}
