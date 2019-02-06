const R = require('ramda')

const db = require('../db/db')

const {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  dbTransformCallback,
} = require('../survey/surveySchemaRepositoryUtils')

const Taxonomy = require('../../common/survey/taxonomy')

const filterProps = {
  uuid: 'uuid',
  code: 'code',
  scientificName: 'scientificName',
  vernacularName: 'vernacularName',
  vernacularNameUuid: 'vernacularNameUuid',
}

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

const fetchTaxaByPropLike = async (surveyId,
                                   taxonomyUuid,
                                   params = {},
                                   draft = false,
                                   client = db) => {
  const {
    filter,
    sort = { field: 'scientificName', asc: true },
    limit = 25,
    offset = 0
  } = params

  const filterProp = R.head(R.keys(filter))
  const filterValue = R.prop(filterProp)(filter)

  const searchValue = filterValue ?
    R.pipe(
      R.trim,
      R.toLower,
      R.replace(/\*/g, '%')
    )(filterValue)
    : null

  switch (filterProp) {
    case filterProps.vernacularName:
      return fetchTaxaByVernacularName(surveyId, taxonomyUuid, searchValue, limit, offset, draft, client)
    default:
      const filterCondition = getPropFilterCondition(filterProp, searchValue, draft)

      return await client.map(
        `SELECT * 
         FROM ${getSurveyDBSchema(surveyId)}.taxon
         WHERE taxonomy_uuid = $1 ${filterCondition ? ` AND ${filterCondition}` : ''}
         ORDER BY
          ${getPropCol(sort.field, true)} ${sort.asc ? 'ASC' : 'DESC'}, 
          ${getPropCol(sort.field, false)} ${sort.asc ? 'ASC' : 'DESC'}
         LIMIT ${limit ? limit : 'ALL'} 
         OFFSET $2`,
        [taxonomyUuid, offset],
        record => dbTransformCallback(record, draft, true)
      )
  }
}

const getTaxonVernacularNameSelectFields = draft => `
  t.*,
  vn.uuid AS vernacular_name_uuid,
  ${draft ? `COALESCE(vn.props_draft->>'name', vn.props->>'name')` : `vn.props->>'name'`} AS vernacular_name,
  ${draft ? `COALESCE(vn.props_draft->>'lang', vn.props->>'lang')` : `vn.props->>'lang'`} AS vernacular_language
`

const fetchTaxaByVernacularName = async (surveyId,
                                         taxonomyUuid,
                                         searchValue,
                                         limit = 25,
                                         offset = 0,
                                         draft = false,
                                         client = db) => {
  const filterCondition = getPropFilterCondition('name', searchValue, draft, 'vn.')

  return await client.map(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${getSurveyDBSchema(surveyId)}.taxon t
       LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
       ON vn.taxon_uuid = t.uuid
     WHERE t.taxonomy_uuid = $1 AND ${filterCondition}
     ORDER BY 
       ${getPropCol('scientificName', true, 't.')},
       ${getPropCol('scientificName', false, 't.')}
     LIMIT ${limit ? limit : 'ALL'}
     OFFSET $2`,
    [taxonomyUuid, offset],
    record => dbTransformCallback(record, draft, true)
  )
}

const fetchTaxonVernacularNameByUuid = async (surveyId, uuid, draft = false, client = db) => {
  return await client.one(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${getSurveyDBSchema(surveyId)}.taxon t
       LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
       ON vn.taxon_uuid = t.uuid
     WHERE vn.uuid = $1`,
    [uuid],
    record => dbTransformCallback(record, draft, true)
  )
}

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

const getPropCol = (propName, draft, columnPrefix = '') =>
  columnPrefix + (draft ? 'props_draft' : 'props') +
  `->>'${propName}'`

const getPropFilterCondition = (propName, searchValue, draft, columnPrefix = '') => {

  const getCondition = draft =>
    `lower(${getPropCol(propName, draft, columnPrefix)}) LIKE '${searchValue}'`

  return searchValue
    ? draft
      ?
      `(
        ${getPropCol(propName, true, columnPrefix)} IS NULL AND ${getCondition(false)}
        OR
        ${getPropCol(propName, true, columnPrefix)} IS NOT NULL AND ${getCondition(true)}
      )`
      : getCondition(false)
    : ''
}

module.exports = {
  //CREATE
  insertTaxonomy,
  insertTaxa,

  //READ
  fetchTaxonomiesBySurveyId,
  fetchTaxonomyByUuid,
  countTaxaByTaxonomyUuid,
  fetchTaxaByPropLike,
  fetchTaxonByUuid,
  fetchTaxonVernacularNameByUuid,

  //UPDATE
  updateTaxonomyProp,

  //DELETE
  deleteTaxonomy,
  deleteDraftTaxaByTaxonomyUuid,
}