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
      [taxonUuid, {lang: lang, name: vn}],
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
    sort = {field: 'scientificName', asc: true},
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
      return fetchTaxaByVernacularName(surveyId, taxonomyUuid, searchValue, sort, limit, offset, draft, client)
    case filterProps.uuid:
      const taxon = await fetchTaxonByUuid(surveyId, searchValue, draft, client)
      return taxon ? [taxon] : []
    case filterProps.vernacularNameUuid:
      const vernacularName = await fetchTaxonVernacularNameByUuid(surveyId, searchValue, draft, client)
      return vernacularName ? [vernacularName] : []
    default:

      const propsCol = draft ? 'props_draft' : 'props'

      return await client.map(
        `SELECT * FROM (
            SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxon
            WHERE taxonomy_uuid = $1 
              ${searchValue ? `AND lower(${propsCol}->>'${filterProp}') LIKE '${searchValue}'` : ''}
            ORDER BY ${propsCol}->>'${sort.field}' ${sort.asc ? 'ASC' : 'DESC'}
          ) AS sorted_taxa 
            LIMIT ${limit ? limit : 'ALL'} 
            OFFSET $2`,
        [taxonomyUuid, offset],
        record => dbTransformCallback(record, draft, true)
      )
  }
}

const fetchTaxaByVernacularName = async (surveyId,
                                         taxonomyUuid,
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
          vn.uuid AS vernacular_name_uuid,
          vn.${propsCol}->>'name' AS vernacular_name, 
          vn.${propsCol}->>'lang' AS vernacular_language
        FROM ${getSurveyDBSchema(surveyId)}.taxon t
          LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
          ON vn.taxon_uuid = t.uuid
        WHERE t.taxonomy_uuid = $1 
          AND lower(vn.${propsCol}->>'name') LIKE '%${searchValue}%'
        ORDER BY t.${propsCol}->>'${sort.field}' ${sort.asc ? 'ASC' : 'DESC'}
      ) AS sorted_taxa 
        LIMIT ${limit ? limit : 'ALL'} 
        OFFSET $2`,
    [taxonomyUuid, offset],
    record => dbTransformCallback(record, draft, true)
  )
}

const fetchTaxonVernacularNameByUuid = async (surveyId, uuid, draft = false, client = db) => {
  const propsCol = draft ? 'props_draft' : 'props'

  return await client.one(
    `SELECT t.*, 
       vn.uuid AS vernacular_name_uuid,
       vn.${propsCol}->>'name' AS vernacular_name, 
       vn.${propsCol}->>'lang' AS vernacular_language
     FROM ${getSurveyDBSchema(surveyId)}.taxon t
       LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
       ON vn.taxon_uuid = t.uuid
     WHERE vn.uuid = $1
    `, [uuid],
    record => dbTransformCallback(record, draft, true)
  )
}

const fetchTaxonByUuid = async (surveyId, uuid, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxon
     WHERE uuid = $1
    `, [uuid],
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
       AND props::text = '{}'::text`,
    [taxonomyUuid]
  )

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