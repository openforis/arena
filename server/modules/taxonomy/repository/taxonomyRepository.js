const R = require('ramda')

const db = require('../../../db/db')

const DbUtils = require('../../../db/dbUtils')

const {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  dbTransformCallback,
} = require('../../survey/repository/surveySchemaRepositoryUtils')

const Taxonomy = require('../../../../common/survey/taxonomy')
const Taxon = require('../../../../common/survey/taxon')

const getTaxonVernacularNameSelectFields = draft => `
  t.*,
  vn.uuid AS vernacular_name_uuid,
  ${DbUtils.getPropColCombined('name', draft, 'vn.')} AS vernacular_name,
  ${DbUtils.getPropColCombined('lang', draft, 'vn.')} AS vernacular_language`

// ============== CREATE

const insertTaxonomy = async (surveyId, taxonomy, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.taxonomy (uuid, props_draft)
        VALUES ($1, $2)
        RETURNING *`,
    [Taxonomy.getUuid(taxonomy), taxonomy.props],
    record => dbTransformCallback(record, true, true)
  )

const insertTaxa = async (surveyId, taxa, client = db) =>
  await client.batch(R.reduce((acc, taxon) => {
      const taxonInsertPromise = insertOrUpdateTaxon(surveyId, taxon, client)

      const vernacularNameInsertPromises = insertOrUpdateVernacularNames(
        surveyId, Taxon.getUuid(taxon), Taxon.getVernacularNames(taxon), client)

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
    [Taxon.getUuid(taxon), Taxon.getTaxonomyUuid(taxon), taxon.props],
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
    `SELECT * 
     FROM ${getSurveyDBSchema(surveyId)}.taxonomy 
     ORDER BY ${DbUtils.getPropColCombined(Taxonomy.taxonomyPropKeys.name, draft)}, id`,
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

const fetchTaxaWithVernacularNames = async (surveyId, taxonomyUuid, draft = false, limit = null, offset = 0, client = db) => {
  const schema = getSurveyDBSchema(surveyId)

  return await client.map(`
      WITH vernacular_names AS
      (
      SELECT
          vn.taxon_uuid,
          json_object_agg(${DbUtils.getPropColCombined('lang', draft, 'vn.')}, ${DbUtils.getPropColCombined('name', draft, 'vn.')})
          AS names
      FROM
          ${schema}.taxon_vernacular_name vn
      GROUP BY 
          vn.taxon_uuid
      )
      
      SELECT
          t.*,
          vn.names as vernacular_names
      FROM
          ${schema}.taxon t
      LEFT OUTER JOIN
          vernacular_names vn
      ON
          vn.taxon_uuid = t.uuid
      WHERE
          t.taxonomy_uuid = $1
      ORDER BY
          (t.props || t.props_draft)->>'scientificName' ASC 
      LIMIT ${limit ? limit : 'ALL'} 
      OFFSET $2
    `,
    [taxonomyUuid, offset],
    record => dbTransformCallback(record, draft, true)
  )
}

const fetchTaxaByCondition = async (surveyId, taxonomyUuid, whereCondition, searchValue, orderByProp, draft, client) =>
  await client.map(
    `SELECT *
       FROM ${getSurveyDBSchema(surveyId)}.taxon
       WHERE taxonomy_uuid = $/taxonomyUuid/ 
         ${whereCondition ? ` AND (${whereCondition})` : ''}
       ORDER BY ${DbUtils.getPropColCombined(orderByProp, draft)} ASC
       LIMIT 25`,
    { taxonomyUuid, searchValue },
    taxon => dbTransformCallback(taxon, draft, true)
  )

const fetchTaxonByCode = async (surveyId, taxonomyUuid, code, draft = false, client = db) => {
  const searchValue = toSearchValue(code)
  const filterCondition = searchValue ? DbUtils.getPropFilterCondition(Taxon.propKeys.code, draft) : ''

  const taxa = await fetchTaxaByCondition(surveyId, taxonomyUuid, filterCondition, searchValue, Taxon.propKeys.code, draft, client)
  return R.head(taxa)
}

const fetchTaxaByPropLike = async (surveyId,
                                   taxonomyUuid,
                                   filterProp,
                                   filterValue,
                                   draft = false,
                                   client = db) => {
  const searchValue = toSearchValue(filterValue)
  const filterCondition = searchValue ? DbUtils.getPropFilterCondition(filterProp, draft) : ''
  return await fetchTaxaByCondition(surveyId, taxonomyUuid, filterCondition, searchValue, filterProp, draft, client)
}

const fetchTaxaByCode = async (surveyId,
                               taxonomyUuid,
                               filterValue,
                               draft = false,
                               client = db) =>
  await fetchTaxaByPropLike(surveyId, taxonomyUuid, Taxon.propKeys.code, filterValue, draft, client)

const fetchTaxaByScientificName = async (surveyId,
                                         taxonomyUuid,
                                         filterValue,
                                         draft = false,
                                         client = db) =>
  await fetchTaxaByPropLike(surveyId, taxonomyUuid, Taxon.propKeys.scientificName, filterValue, draft, client)

const fetchTaxaByCodeOrScientificName = async (surveyId, taxonomyUuid, filterValue, draft = false, client = db) => {

  const searchValue = toSearchValue(`*${filterValue}*`)
  const whereCondition = `
    ${DbUtils.getPropFilterCondition(Taxon.propKeys.scientificName, draft)} 
     OR  
    ${DbUtils.getPropFilterCondition(Taxon.propKeys.code, draft)}
    `

  return await fetchTaxaByCondition(surveyId, taxonomyUuid, whereCondition, searchValue, Taxon.propKeys.scientificName, draft, client)
}

const fetchTaxaByVernacularName = async (surveyId,
                                         taxonomyUuid,
                                         filterValue,
                                         draft = false,
                                         client = db) => {
  const searchValue = toSearchValue(filterValue)
  const filterCondition = searchValue ? DbUtils.getPropFilterCondition('name', draft, 'vn.') : ''

  return await client.map(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${getSurveyDBSchema(surveyId)}.taxon t
       LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
       ON vn.taxon_uuid = t.uuid
     WHERE t.taxonomy_uuid = $/taxonomyUuid/ 
      AND ${filterCondition}
     ORDER BY ${DbUtils.getPropColCombined('name', draft, 'vn.')} ASC
     LIMIT 20`,
    { taxonomyUuid, searchValue },
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

// ============== Index
const fetchIndex = async (surveyId, draft = false, client = db) =>
  await client.map(`
    SELECT
      t.taxonomy_uuid,
      t.uuid,
      t.props,
      t.props_draft,
      v.vernacular_names
    FROM
      ${getSurveyDBSchema(surveyId)}.taxon t
    LEFT OUTER JOIN
      (
        SELECT
          v.taxon_uuid,
          json_agg( json_build_object(${DbUtils.getPropColCombined('name', draft, 'v.')}, v.uuid::text) ) AS vernacular_names
        FROM
          ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name v
        GROUP BY
          v.taxon_uuid ) v
    ON
      v.taxon_uuid = t.uuid
    `,
    [],
    indexItem => dbTransformCallback(indexItem, draft, true)
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
  // taxonomies
  fetchTaxonomiesBySurveyId,
  fetchTaxonomyByUuid,

  // taxa
  countTaxaByTaxonomyUuid,
  fetchTaxaByCode,
  fetchTaxaByScientificName,
  fetchTaxaByCodeOrScientificName,
  fetchTaxaByVernacularName,
  fetchTaxaWithVernacularNames,

  fetchTaxonByUuid,
  fetchTaxonByCode,
  fetchTaxonVernacularNameByUuid,

  fetchIndex,

  //UPDATE
  updateTaxonomyProp,

  //DELETE
  deleteTaxonomy,
  deleteDraftTaxaByTaxonomyUuid,
}