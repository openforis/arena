const path = require('path')

const config = require('../../webpack.config')

module.exports = {
  ...config('jest'),
  entry: path.resolve(__dirname, 'jest.setup.js'),
  output: {
    path: path.resolve(__dirname, '..', '..', 'dist', '__tests__'),
    filename: 'bundle.test.integration-setup.js',
  },
}
