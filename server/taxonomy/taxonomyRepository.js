const db = require('../db/db')
const R = require('ramda')

const {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord
} = require('../survey/surveySchemaRepositoryUtils')
const {dbTransformCallback} = require('../nodeDef/nodeDefRepository')
const {getTaxonVernacularNames} = require('../../common/survey/taxonomy')

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
  await client.tx(t =>
    t.batch(R.reduce((acc, taxon) => {
        const taxonInsertPromise = t.none(
          `INSERT INTO ${getSurveyDBSchema(surveyId)}.taxon (uuid, taxonomy_id, props_draft)
            VALUES ($1, $2, $3)`,
          [taxon.uuid, taxon.taxonomyId, taxon.props]
        )

        //insert taxon vernacular names
        const vernacularNames = getTaxonVernacularNames(taxon)

        const vernacularNameInsertPromises = R.keys(vernacularNames).map(lang => {
          const vn = R.prop(lang, vernacularNames)
          return t.none(
            `INSERT INTO ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name (taxon_uuid, props_draft)
              VALUES ($1, $2)`,
            [taxon.uuid, {lang: lang, name: vn}]
          )
        })

        return R.pipe(
          R.append(taxonInsertPromise),
          R.concat(vernacularNameInsertPromises)
        )(acc)
      }, [], taxa)
    )
  )
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

const fetchTaxaByProp = async (surveyId,
                               taxonomyId,
                               filter,
                               sort = {field: 'scientificName', asc: true},
                               limit = 25,
                               offset = 0,
                               draft = false,
                               client = db) => {
  const filterProp = R.head(R.keys(filter))
  const filterValue = R.prop(filterProp)(filter)
  const searchValue = filterValue ? R.pipe(R.trim, R.toLower)(filterValue) : null

  if (searchValue && filterProp === 'vernacularName') {
    return fetchTaxaByVernacularName(surveyId, taxonomyId, searchValue, sort, limit, offset, draft, client)
  } else {
    const propsCol = draft ? 'props_draft' : 'props'

    return await client.map(
      `SELECT * FROM (
          SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxon
          WHERE taxonomy_id = $1 
            ${searchValue ? `AND lower(${propsCol}->>'${filterProp}') LIKE '%${searchValue}%'` : ''}
          ORDER BY ${propsCol}->>'${sort.field}' ${sort.asc ? 'ASC' : 'DESC'}
        ) AS sorted_taxa 
          LIMIT ${limit ? limit : 'ALL'} 
          OFFSET $2`,
      [taxonomyId, offset],
      record => dbTransformCallback(record, draft)
    )
  }
}

const fetchTaxaByVernacularName = async (surveyId,
                                         taxonomyId,
                                         searchValue,
                                         sort = {field: 'scientificName', asc: true},
                                         limit = 25,
                                         offset = 0,
                                         draft = false,
                                         client = db) => {
  const propsCol = draft ? 'props_draft' : 'props'

  return await client.map(
    `SELECT * FROM (
        SELECT t.*, 
          vn.${propsCol}->>'name' AS vernacular_name, 
          vn.${propsCol}->>'lang' AS vernacular_language
        FROM ${getSurveyDBSchema(surveyId)}.taxon t
          LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
          ON vn.taxon_uuid = t.uuid
        WHERE t.taxonomy_id = $1 
          AND lower(vn.${propsCol}->>'name') LIKE '%${searchValue}%'
        ORDER BY t.${propsCol}->>'${sort.field}' ${sort.asc ? 'ASC' : 'DESC'}
      ) AS sorted_taxa 
        LIMIT ${limit ? limit : 'ALL'} 
        OFFSET $2`,
    [taxonomyId, offset],
    record => dbTransformCallback(record, draft)
  )
}

// ============== UPDATE

const updateTaxonomyProp = async (surveyId, taxonomyId, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'taxonomy', taxonomyId, key, value, client)

// ============== DELETE

const deleteTaxonomy = async (surveyId, taxonomyId, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'taxonomy', taxonomyId, client)

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
  fetchTaxonomyById,
  fetchTaxonomiesBySurveyId,
  countTaxaByTaxonomyId,
  fetchTaxaByProp,

  //UPDATE
  updateTaxonomyProp,

  //DELETE
  deleteTaxonomy,
  deleteTaxaByTaxonomyId,
}