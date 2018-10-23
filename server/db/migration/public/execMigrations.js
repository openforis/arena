const Promise = require('bluebird')
const DBMigrate = require('db-migrate')

const config = require('../migrationConfig')

const {fetchAllSurveys} = require('../../../survey/surveyRepository')
const {migrateSurveySchema} = require('../survey/execMigrations')
const {getProcessNodeEnv} = require('../../../../common/processUtils')

const migrateOptions = {
  config,
  cwd: `${__dirname}/`,
  env: getProcessNodeEnv(),
}

const migrateSurveySchemas = async () => {
  const surveys = await fetchAllSurveys()

  console.log(`starting data schemas migrations for ${surveys.length} surveys`)

  for (let i = 0; i < surveys.length; i++) {
    const survey = surveys[i]
    await migrateSurveySchema(survey.id)
  }
  console.log(`data schemas migrations completed`)
}

module.exports = async () => {
  try {
    console.log('running database migrations')

    const dbm = DBMigrate.getInstance(true, migrateOptions)

    await dbm.up()

    console.log('database migrations completed')

    await migrateSurveySchemas()
  } catch (err) {
    console.log('error running database migrations', err)
  }
}
