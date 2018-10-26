require('babel-polyfill')
require('dotenv').config()
// const path = require('path')
// const R = require('ramda')

const {initTestContext, destroyTestContext} = require('./../testContext')

const surveyTest = require('./testFiles/survey')
const nodeDefTest = require('./testFiles/nodeDef')

// const migrationsTestDirname = process.env.migrations_test_dirname
// require('fs').readdirSync(migrationsTestDirname).forEach(function (file) {
//   console.log('===== ', file)
//   if (R.endsWith('.js'))
//     require(path.resolve( migrationsTestDirname,file))
// })

console.log("==== ", process.env.migrations_test_dirname)
before(initTestContext)

describe('Survey Test', () => {

  // ==== SURVEY
  it('Create Survey', surveyTest.createSurveyTest)

  it('Create Node Defs', nodeDefTest.createNodeDefsTest)

  //it('Update Node Def', nodeDefTest.updateNodeDefTest)

})

after(destroyTestContext)