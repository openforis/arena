const R = require('ramda')

const environments = {
  development: 'development',
  production: 'production',
}

const getEnvVariable = (variable, defaultValue = null) => R.pathOr(defaultValue, ['env', variable])(process)

const ENV = {
  port: getEnvVariable('PORT', '9090'),
  nodeEnv: getEnvVariable('NODE_ENV', environments.development),
  tempFolder: getEnvVariable('TEMP_FOLDER', '/tmp/arena_upload'),
  buildReport: getEnvVariable('BUILD_REPORT') === 'true',
  sourceVersion: getEnvVariable('SOURCE_VERSION', 'N/A'),
  //COGNITO
  cognitoRegion: getEnvVariable('COGNITO_REGION'),
  cognitoUserPoolId: getEnvVariable('COGNITO_USER_POOL_ID'),
  cognitoClientId: getEnvVariable('COGNITO_CLIENT_ID'),
  //DB
  dbUrl: getEnvVariable('DATABASE_URL'),
  pgUser: getEnvVariable('PGUSER'),
  pgPassword: getEnvVariable('PGPASSWORD'),
  pgDatabase: getEnvVariable('PGDATABASE'),
  pgSchema: getEnvVariable('PGSCHEMA'),
  pgHost: getEnvVariable('PGHOST'),
  pgPort: getEnvVariable('PGPORT'),
  pgSsl: getEnvVariable('PGSSL') === 'true',
  //EMAIL
  adminEmail: getEnvVariable('ADMIN_EMAIL'),
  sendGridApiKey: getEnvVariable('SENDGRID_API_KEY'),
}

const envDevelopment = ENV.nodeEnv === environments.development

module.exports = {
  ENV,
  envDevelopment
}