const path = require('path')

const config = require('../../webpack.config')

const configIntegration = config('integration')
const configIntegrationSetup = {
  ...configIntegration,
  entry: path.resolve(__dirname, 'jest.setup.js'),
  output: {
    path: path.resolve(__dirname, '..', '..', '..', 'dist', '__tests__'),
    filename: 'bundle.integration-setup.js',
  },
}

module.exports = [configIntegration, configIntegrationSetup]
