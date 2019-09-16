const R = require('ramda')

const environments = {
  development: 'development'
}

const getEnvVariable = (variable, defaultValue = null) => R.propOr(defaultValue, variable)(process.env)

const processNodeEnv = getEnvVariable('NODE_ENV', environments.development)

const envDevelopment = processNodeEnv === environments.development

module.exports = {
  getEnvVariable,
  envDevelopment
}