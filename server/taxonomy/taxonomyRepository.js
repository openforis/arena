const db = require('../db/db')
const R = require('ramda')

const {updateSurveyTableProp, deleteSurveyTableRecord} = require('../serverUtils/repository')
const {dbTransformCallback} = require('../nodeDef/nodeDefRepository')
const {getSurveyDBSchema} = require('../../common/survey/survey')
const {getTaxonomyVernacularLanguageCodes} = require('../../common/survey/taxonomy')

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

const fetchTaxonomyById = async (surveyId, id, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxonomy
     WHERE id = $1`,
    [id],
    record => dbTransformCallback(record, draft)
  )

const fetchTaxonomiesBySurveyId = async (surveyId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxonomy`,
    [],
    record => dbTransformCallback(record, draft)
  )

const countTaxaByTaxonomyId = async (surveyId, taxonomyId, draft = false, client = db) =>
  await client.one(`
      SELECT COUNT(*) 
      FROM ${getSurveyDBSchema(surveyId)}.taxon
      WHERE taxonomy_id = $1`,
    [taxonomyId],
    record => record.count)

const createTaxonFieldFilterCondition = (taxonomy, filter, field, draft) => {
  const propsCol = draft ? 'props_draft' : 'props'
  const filterValue = R.pipe(R.prop(field), R.toLower)(filter)

  if (R.isEmpty(filterValue))
    return 'false'

  const vernacularLanguageCodes = getTaxonomyVernacularLanguageCodes(taxonomy)

  if (field === 'vernacularName') {
    return R.isEmpty(vernacularLanguageCodes)
      ? ' false ' //cannot search by vernacular name
      : ('(' +
        R.pipe(
          R.map(langCode => `lower(${propsCol}#>>'{vernacularNames, ${langCode}}') LIKE '%${filterValue}%'`),
          R.join(' OR '),
        )(vernacularLanguageCodes) +
        ')')
  } else {
    return `lower(${propsCol}->>'${field}') LIKE '%${filterValue}%'`
  }
}

const fetchTaxa = async (surveyId,
                         taxonomyId,
                         limit = 25,
                         offset = 0,
                         filter = null, //e.g. {code: 'AAA', scientificName: 'Acacia', vernacularName: 'Mohagany'}
                         sort = {field: 'scientificName', asc: true},
                         draft = false,
                         client = db) => {
  const propsCol = draft ? 'props_draft' : 'props'

  const taxonomy = await fetchTaxonomyById(surveyId, taxonomyId, draft)

  const filterConditions = filter
    ? R.pipe(
      R.keys,
      R.map(field => createTaxonFieldFilterCondition(taxonomy, filter, field, draft)),
      R.join(' AND '),
    )(filter)
    : null

  return await client.map(
    `SELECT * FROM (
        SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxon
        WHERE taxonomy_id = $1 ${filterConditions ? ' AND ' + filterConditions : ''}
        ORDER BY ${propsCol}->>'${sort.field}' ${sort.asc ? 'ASC' : 'DESC'}
      ) AS sorted_taxa 
        LIMIT ${limit ? limit : 'ALL'} 
        OFFSET $2`,
    [taxonomyId, offset],
    record => dbTransformCallback(record, draft)
  )
}
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
  countTaxaByTaxonomyId,
  fetchTaxa,
  //UPDATE
  updateTaxonomyProp,
  //DELETE
  deleteTaxonomy,
  deleteTaxaByTaxonomyId,
}