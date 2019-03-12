const R = require('ramda')

const db = require('../../../db/db')

const {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  dbTransformCallback,
} = require('../../survey/persistence/surveySchemaRepositoryUtils')

const Taxonomy = require('../../../../common/survey/taxonomy')

const { isBlank } = require('../../../../common/stringUtils')

const getTaxonVernacularNameSelectFields = draft => `
  t.*,
  vn.uuid AS vernacular_name_uuid,
  ${getPropDraftOrNot('name', draft, 'vn.')} AS vernacular_name,
  ${getPropDraftOrNot('lang', draft, 'vn.')} AS vernacular_language`

// ============== CREATE

const insertTaxonomy = async (surveyId, taxonomy, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.taxonomy (uuid, props_draft)
        VALUES ($1, $2)
        RETURNING *`,
    [taxonomy.uuid, taxonomy.props],
    record => dbTransformCallback(record, true, true)
  )

const insertTaxa = async (surveyId, taxa, client = db) =>
  await client.batch(R.reduce((acc, taxon) => {
      const taxonInsertPromise = insertOrUpdateTaxon(surveyId, taxon, client)

      const vernacularNameInsertPromises = insertOrUpdateVernacularNames(
        surveyId, taxon.uuid, Taxonomy.getTaxonVernacularNames(taxon), client)

      return R.pipe(
        R.append(taxonInsertPromise),
        R.concat(vernacularNameInsertPromises)
      )(acc)
    }, [], taxa)
  )

const insertOrUpdateTaxon = (surveyId, taxon, client = db) =>
  client.one(
    `INSERT INTO ${getSurveyDBSchema(surveyId)}.taxon (uuid, taxonomy_uuid, props_draft)
      VALUES ($1, $2, $3)
      ON CONFLICT (taxonomy_uuid, (props_draft->>'code')) DO
        UPDATE SET props_draft = ${getSurveyDBSchema(surveyId)}.taxon.props_draft || $3
      RETURNING *`,
    [taxon.uuid, taxon.taxonomyUuid, taxon.props],
    record => dbTransformCallback(record, true, true)
  )

const insertOrUpdateVernacularNames = (surveyId, taxonUuid, vernacularNames, client = db) =>
  R.keys(vernacularNames).map(lang => {
    const vn = R.prop(lang, vernacularNames)
    return client.one(
      `INSERT INTO ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name (taxon_uuid, props_draft)
        VALUES ($1, $2)
        ON CONFLICT (taxon_uuid, (props_draft->>'lang')) DO
         UPDATE SET props_draft = ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name.props_draft || $2
        RETURNING *`,
      [taxonUuid, { lang: lang, name: vn }],
      record => dbTransformCallback(record, true, true)
    )
  })

// ============== READ

const fetchTaxonomyByUuid = async (surveyId, uuid, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxonomy
     WHERE uuid = $1`,
    [uuid],
    record => dbTransformCallback(record, draft, true)
  )

const fetchTaxonomiesBySurveyId = async (surveyId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxonomy`,
    [],
    record => dbTransformCallback(record, draft, true)
  )

const countTaxaByTaxonomyUuid = async (surveyId, taxonomyUuid, draft = false, client = db) =>
  await client.one(`
      SELECT COUNT(*) 
      FROM ${getSurveyDBSchema(surveyId)}.taxon
      WHERE taxonomy_uuid = $1`,
    [taxonomyUuid],
    r => parseInt(r.count)
  )

const fetchAllTaxa = async (surveyId, taxonomyUuid, draft = false, limit = null, offset = 0, client = db) =>
  await client.map(
    `SELECT * 
     FROM ${getSurveyDBSchema(surveyId)}.taxon
     WHERE taxonomy_uuid = $1
     ORDER BY ${getPropDraftOrNot(Taxonomy.taxonPropKeys.scientificName, draft)} ASC 
     LIMIT ${limit ? limit : 'ALL'} 
     OFFSET $2`,
    [taxonomyUuid, offset],
    record => dbTransformCallback(record, draft, true)
  )

const fetchTaxaByCondition = async (surveyId, taxonomyUuid, whereCondition, orderByProp, draft, client) =>
  await client.map(
    `SELECT * 
       FROM ${getSurveyDBSchema(surveyId)}.taxon
       WHERE taxonomy_uuid = $1 
         ${whereCondition ? ` AND (${whereCondition})` : ''}
       ORDER BY ${getPropDraftOrNot(orderByProp, draft)} ASC
       LIMIT 25`,
    [taxonomyUuid],
    taxon => dbTransformCallback(taxon, draft, true)
  )

const fetchTaxaByPropLike = async (surveyId,
                                   taxonomyUuid,
                                   filterProp,
                                   filterValue,
                                   draft = false,
                                   client = db) => {

  const searchValue = toSearchValue(filterValue)
  const filterCondition = getPropFilterCondition(filterProp, searchValue, draft)

  return await fetchTaxaByCondition(surveyId, taxonomyUuid, filterCondition, filterProp, draft, client)
}

const fetchTaxonByCode = async (surveyId, taxonomyUuid, code, draft = false, client = db) => {
  const taxa = await fetchTaxaByPropLike(surveyId, taxonomyUuid, Taxonomy.taxonPropKeys.code, code, draft, client)
  return R.head(taxa)
}

const findTaxaByCodeOrScientificName = async (surveyId, taxonomyUuid, filterValue, draft = false, client = db) => {

  const searchValue = toSearchValue(filterValue)
  const whereCondition = isBlank(searchValue)
    ? null
    : `
    ${getPropFilterCondition(Taxonomy.taxonPropKeys.scientificName, '%' + searchValue + '%', draft)} 
     OR  
    ${getPropFilterCondition(Taxonomy.taxonPropKeys.code, '%' + searchValue + '%', draft)}
    `

  return await fetchTaxaByCondition(surveyId, taxonomyUuid, whereCondition, Taxonomy.taxonPropKeys.scientificName, draft, client)
}

const fetchTaxaByVernacularName = async (surveyId,
                                         taxonomyUuid,
                                         filterValue,
                                         draft = false,
                                         client = db) => {
  const searchValue = toSearchValue(filterValue)
  const filterCondition = getPropFilterCondition('name', searchValue, draft, 'vn.')

  return await client.map(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${getSurveyDBSchema(surveyId)}.taxon t
       LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
       ON vn.taxon_uuid = t.uuid
     WHERE t.taxonomy_uuid = $1 
      AND ${filterCondition}
     ORDER BY ${getPropDraftOrNot(Taxonomy.taxonPropKeys.name, draft, 'vn.')} ASC
     LIMIT 20`,
    [taxonomyUuid],
    record => dbTransformCallback(record, draft, true)
  )
}

const fetchTaxonVernacularNameByUuid = async (surveyId, uuid, draft = false, client = db) =>
  await client.one(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${getSurveyDBSchema(surveyId)}.taxon t
       LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
       ON vn.taxon_uuid = t.uuid
     WHERE vn.uuid = $1`,
    [uuid],
    record => dbTransformCallback(record, draft, true)
  )

const fetchTaxonByUuid = async (surveyId, uuid, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxon
     WHERE uuid = $1
    `
    , [uuid],
    record => dbTransformCallback(record, draft, true)
  )

// ============== UPDATE

const updateTaxonomyProp = async (surveyId, taxonomyUuid, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'taxonomy', taxonomyUuid, key, value, client)

// ============== DELETE

const deleteTaxonomy = async (surveyId, taxonomyUuid, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'taxonomy', taxonomyUuid, client)

const deleteDraftTaxaByTaxonomyUuid = async (surveyId, taxonomyUuid, client = db) =>
  await client.none(
    `DELETE FROM ${getSurveyDBSchema(surveyId)}.taxon
     WHERE taxonomy_uuid = $1
       AND props::text = '{}'::text`
    ,
    [taxonomyUuid]
  )

/**
 * If draft, returns something like prop_draft->>'propName', otherwise prop->>'propName'
 */
const getPropCol = (propName, draft, columnPrefix = '') =>
  `${columnPrefix} ${draft ? 'props_draft' : 'props'}->>'${propName}'`

/**
 * Combines a draft and a published column prop, if needed, using the COALESCE function
 */
const getPropDraftOrNot = (propName, draft, columnPrefix) =>
  draft
    ? `COALESCE(${getPropCol(propName, true, columnPrefix)}, ${getPropCol(propName, false, columnPrefix)})`
    : getPropCol(propName, false, columnPrefix)

/**
 * Generates a filter condition like "lower(col) LIKE 'searchValue' where "col" is a json prop column
 */
const getPropFilterCondition = (propName, searchValue, draft, columnPrefix = '') => {
  return searchValue
    ? `lower(${getPropDraftOrNot(propName, draft, columnPrefix)}) LIKE '${searchValue}'`
    : ''
}

const toSearchValue = filterValue =>
  filterValue ?
    R.pipe(
      R.ifElse(
        R.is(String),
        R.identity,
        R.toString
      ),
      R.trim,
      R.toLower,
      R.replace(/\*/g, '%')
    )(filterValue)
    : null

module.exports = {
  //CREATE
  insertTaxonomy,
  insertTaxa,

  //READ
  fetchTaxonomiesBySurveyId,
  fetchTaxonomyByUuid,
  countTaxaByTaxonomyUuid,
  fetchTaxaByPropLike,
  fetchTaxaByVernacularName,
  findTaxaByCodeOrScientificName,
  fetchTaxonByUuid,
  fetchTaxonByCode,
  fetchTaxonVernacularNameByUuid,
  fetchAllTaxa,

  //UPDATE
  updateTaxonomyProp,

  //DELETE
  deleteTaxonomy,
  deleteDraftTaxaByTaxonomyUuid,
}