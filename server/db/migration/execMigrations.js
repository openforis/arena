const DBMigrate = require('db-migrate')

const config = require('./migrationConfig')
const {fetchSurveys} = require('../../survey/surveyRepository')
const {migrateSurveyDataSchema} = require('./survey/surveyDataSchemaMigrator')

const migrateOptions = {
  config,
  cwd: `${__dirname}/`,
  env: process.env.NODE_ENV,
}

const migrateSurveyDataSchemas = async() => {
  const surveys = await fetchSurveys()

  console.log(`starting data schemas migrations for ${surveys.length} surveys`)

  await Promise.all(surveys.map(async s => {
    await migrateSurveyDataSchema(s.id)
  }))

  console.log(`data schemas migrations completed`)
}

module.exports = async () => {
  try {
    console.log('running database migrations')

    const dbm = DBMigrate.getInstance(true, migrateOptions)

    await dbm.up()

    console.log('database migrations completed')

    await migrateSurveyDataSchemas()
  } catch (err) {
    console.log('error running database migrations', err)
  }
}
