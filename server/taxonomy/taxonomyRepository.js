const db = require('../db/db')
const R = require('ramda')

const {updateSurveyTableProp, deleteSurveyTableRecord} = require('../serverUtils/repository')
const {dbTransformCallback} = require('../nodeDef/nodeDefRepository')
const {getSurveyDBSchema} = require('../../common/survey/survey')

// ============== CREATE

const insertTaxonomy = async (surveyId, taxonomy, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.taxonomy (uuid, props_draft)
        VALUES ($1, $2)
        RETURNING *`,
    [taxonomy.uuid, taxonomy.props],

    record => dbTransformCallback(record, true)
  )

// ============== READ

const fetchTaxonomiesBySurveyId = async (surveyId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxonomy`,
    [],
    record => dbTransformCallback(record, draft)
  )

// ============== UPDATE

const updateTaxonomyProp = R.partial(updateSurveyTableProp, ['taxonomy'])

// ============== DELETE

const deleteTaxonomy = R.partial(deleteSurveyTableRecord, ['taxonomy'])

module.exports = {
  //CREATE
  insertTaxonomy,
  //READ
  fetchTaxonomiesBySurveyId,
  //UPDATE
  updateTaxonomyProp,
  //DELETE
  deleteTaxonomy,
}