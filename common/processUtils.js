const development = 'development'

const getProcessNodeEnv = () => process.env.NODE_ENV || development

const isEnvDevelopment = () => getProcessNodeEnv() === development

module.exports = {
  getProcessNodeEnv,
  isEnvDevelopment,
}