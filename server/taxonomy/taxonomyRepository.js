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

const insertTaxa = async (surveyId, taxa, client = db) => {
  await client.tx(t => {
    t.batch(taxa.map(taxon =>
      t.none(`INSERT INTO ${getSurveyDBSchema(surveyId)}.taxon (uuid, taxonomy_id, props_draft)
        VALUES ($1, $2, $3)`,
      [taxon.uuid, taxon.taxonomyId, taxon.props]
    )))
  })
}

// ============== READ

const fetchTaxonomiesBySurveyId = async (surveyId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxonomy`,
    [],
    record => dbTransformCallback(record, draft)
  )

const fetchTaxaByTaxonomyId = async (surveyId, taxonomyId, sort = {field: 'scientificName', asc: true}, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxon
     WHERE taxonomy_id = $1
     ORDER BY ${draft ? 'props_draft' : 'props'}->>'${sort.field}' ${sort.asc ? 'ASC': 'DESC'}`,
    [taxonomyId],
    record => dbTransformCallback(record, draft)
  )

// ============== UPDATE

const updateTaxonomyProp = R.partial(updateSurveyTableProp, ['taxonomy'])

// ============== DELETE

const deleteTaxonomy = R.partial(deleteSurveyTableRecord, ['taxonomy'])

const deleteTaxaByTaxonomyId = async (surveyId, taxonomyId, client = db) =>
  await client.none(
    `DELETE FROM ${getSurveyDBSchema(surveyId)}.taxon
     WHERE taxonomy_id = $1`,
    [taxonomyId]
  )

module.exports = {
  //CREATE
  insertTaxonomy,
  insertTaxa,
  //READ
  fetchTaxonomiesBySurveyId,
  fetchTaxaByTaxonomyId,
  //UPDATE
  updateTaxonomyProp,
  //DELETE
  deleteTaxonomy,
  deleteTaxaByTaxonomyId,
}