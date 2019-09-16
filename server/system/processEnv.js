const ProcessUtils = require('../../common/processUtils')

const ENV = {
  port: ProcessUtils.getEnvVariable('PORT', '9090'),
  nodeEnv: ProcessUtils.getEnvVariable('NODE_ENV', 'development'),
  tempFolder: ProcessUtils.getEnvVariable('TEMP_FOLDER', '/tmp/arena_upload'),
  adminEmail: ProcessUtils.getEnvVariable('ADMIN_EMAIL'),
  buildReport: ProcessUtils.getEnvVariable('BUILD_REPORT') === 'true',
  sourceVersion: ProcessUtils.getEnvVariable('SOURCE_VERSION', 'N/A'),
  //COGNITO
  cognitoRegion: ProcessUtils.getEnvVariable('COGNITO_REGION'),
  cognitoUserPoolId: ProcessUtils.getEnvVariable('COGNITO_USER_POOL_ID'),
  cognitoClientId: ProcessUtils.getEnvVariable('COGNITO_CLIENT_ID'),
  //DB
  dbUrl: ProcessUtils.getEnvVariable('DATABASE_URL'),
  pgUser: ProcessUtils.getEnvVariable('PGUSER'),
  pgPassword: ProcessUtils.getEnvVariable('PGPASSWORD'),
  pgDatabase: ProcessUtils.getEnvVariable('PGDATABASE'),
  pgSchema: ProcessUtils.getEnvVariable('PGSCHEMA'),
  pgHost: ProcessUtils.getEnvVariable('PGHOST'),
  pgPort: ProcessUtils.getEnvVariable('PGPORT'),
  pgSsl: ProcessUtils.getEnvVariable('PGSSL') === 'true'
}

module.exports = ENV