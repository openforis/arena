const environments = {
  development: 'development',
  production: 'production',
}

const ENV = {
  arenaRoot: process.env['ARENA_ROOT'],
  arenaDist: process.env['ARENA_DIST'],
  port: process.env['PORT'] || '9090',
  nodeEnv: process.env['NODE_ENV'] || environments.development,
  tempFolder: process.env['TEMP_FOLDER'] || '/tmp/arena_upload',
  buildReport: process.env['BUILD_REPORT'] === 'true',
  // APP VERSION
  applicationVersion: process.env['APPLICATION_VERSION'],
  gitCommitHash: process.env['GIT_COMMIT_HASH'],
  gitBranch: process.env['GIT_BRANCH'],
  // COGNITO
  cognitoRegion: process.env['COGNITO_REGION'],
  cognitoUserPoolId: process.env['COGNITO_USER_POOL_ID'],
  cognitoClientId: process.env['COGNITO_CLIENT_ID'],
  // DB
  dbUrl: process.env['DATABASE_URL'],
  pgUser: process.env['PGUSER'],
  pgPassword: process.env['PGPASSWORD'],
  pgDatabase: process.env['PGDATABASE'],
  pgSchema: process.env['PGSCHEMA'],
  pgHost: process.env['PGHOST'],
  pgPort: process.env['PGPORT'],
  pgSsl: process.env['PGSSL'] === 'true',
  migrateOnly: process.env['MIGRATE_ONLY'] === 'true',
  // EMAIL
  adminEmail: process.env['ADMIN_EMAIL'],
  sendGridApiKey: process.env['SENDGRID_API_KEY'],
  // ANALYSIS
  analysisOutputDir: process.env['ANALYSIS_OUTPUT_DIR'],
}

const isEnvDevelopment = ENV.nodeEnv === environments.development
const isEnvProduction = ENV.nodeEnv === environments.production

module.exports = {
  ENV,
  isEnvDevelopment,
  isEnvProduction,
}