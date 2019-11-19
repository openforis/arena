import * as R from 'ramda'
import * as toSnakeCase from 'to-snake-case'

import { db } from '@server/db/db'

import * as DbUtils from '@server/db/dbUtils'

import {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  dbTransformCallback
} from '../../survey/repository/surveySchemaRepositoryUtils'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

const getTaxonVernacularNameSelectFields = draft => `
  t.*,
  vn.uuid AS vernacular_name_uuid,
  ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.name, draft, 'vn.')} AS vernacular_name,
  ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.lang, draft, 'vn.')} AS vernacular_language`

// ============== CREATE

export const insertTaxonomy = async (surveyId, taxonomy, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.taxonomy (uuid, props_draft)
        VALUES ($1, $2)
        RETURNING *`,
    [Taxonomy.getUuid(taxonomy), taxonomy.props],
    record => dbTransformCallback(record, true, true)
  )

const _insertOrUpdateVernacularNames = (surveyId, taxonUuid, vernacularNames, client = db) =>
  Object.entries(vernacularNames).map(([lang, vernacularName]) =>
    client.none(
      `INSERT INTO 
           ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name (uuid, taxon_uuid, props_draft)
        VALUES 
          ($1, $2, $3)
        ON CONFLICT 
          (taxon_uuid, ((props||props_draft)->>'${TaxonVernacularName.keysProps.lang}')) DO
        UPDATE SET 
          props_draft = ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name.props_draft || $3`,
      [TaxonVernacularName.getUuid(vernacularName), taxonUuid, TaxonVernacularName.getProps(vernacularName)]
    )
  )

export const insertTaxon = async (surveyId, taxon, client = db) =>
  await client.batch([
    client.none(
      `INSERT INTO ${getSurveyDBSchema(surveyId)}.taxon (uuid, taxonomy_uuid, props_draft)
       VALUES ($1, $2, $3)`,
      [Taxon.getUuid(taxon), Taxon.getTaxonomyUuid(taxon), Taxon.getProps(taxon)]
    ),
    ..._insertOrUpdateVernacularNames(surveyId, Taxon.getUuid(taxon), Taxon.getVernacularNames(taxon), client)
  ])

export const insertTaxa = async (surveyId, taxa, client = db) =>
  await client.batch(taxa.map(
    taxon => insertTaxon(surveyId, taxon, client)
  ))

// ============== READ

export const fetchTaxonomyByUuid = async (surveyId, uuid, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxonomy
     WHERE uuid = $1`,
    [uuid],
    record => dbTransformCallback(record, draft, true)
  )

export const fetchTaxonomiesBySurveyId = async (surveyId, draft = false, client = db) =>
  await client.map(
    `SELECT * 
     FROM ${getSurveyDBSchema(surveyId)}.taxonomy 
     ORDER BY ${DbUtils.getPropColCombined(Taxonomy.keysProps.name, draft)}, id`,
    [],
    record => dbTransformCallback(record, draft, true)
  )

export const countTaxaByTaxonomyUuid = async (surveyId, taxonomyUuid, draft = false, client = db) =>
  await client.one(`
      SELECT COUNT(*) 
      FROM ${getSurveyDBSchema(surveyId)}.taxon
      WHERE taxonomy_uuid = $1`,
    [taxonomyUuid],
    r => parseInt(r.count)
  )

export const fetchTaxaWithVernacularNames = async (surveyId, taxonomyUuid, draft = false, limit = null, offset = 0, client = db) =>
  await client.map(`
      SELECT
          t.*,
          COALESCE(
            jsonb_object_agg(
              ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.lang, draft, 'vn.')},
              json_build_object(
                '${TaxonVernacularName.keys.uuid}', vn.uuid,
                '${TaxonVernacularName.keys.props}', ${DbUtils.getPropsCombined(draft, 'vn.', false)}
              )
            ) FILTER (WHERE vn.uuid IS NOT NULL),
            '{}'
          ) as vernacular_names
      FROM
          ${getSurveyDBSchema(surveyId)}.taxon t
      LEFT OUTER JOIN
          ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn
      ON
          vn.taxon_uuid = t.uuid
      WHERE
          t.taxonomy_uuid = $1
      GROUP BY
          t.id
      ORDER BY
        ${DbUtils.getPropColCombined(Taxon.propKeys.family, draft, 't.')},
        ${DbUtils.getPropColCombined(Taxon.propKeys.scientificName, draft, 't.')}
      LIMIT ${limit ? limit : 'ALL'} 
      OFFSET $2
    `,
    [taxonomyUuid, offset],
    record => dbTransformCallback(record, draft, true)
  )

export const fetchTaxaWithVernacularNamesStream = (surveyId, taxonomyUuid, vernacularLangCodes, draft = false) => {
  const vernacularNamesSubSelects = R.pipe(
    R.map(langCode =>
      `(
          SELECT
              ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.name, draft, 'vn.')}
          FROM
               ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn
          WHERE
              vn.taxon_uuid = t.uuid
              AND ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.lang, draft, 'vn.')} = '${langCode}' 
       ) AS ${langCode}`
    ),
    R.join(', ')
  )(vernacularLangCodes)

  const propsFields = R.pipe(
    R.map(prop => `${DbUtils.getPropColCombined(prop, draft, 't.')} AS ${toSnakeCase(prop)}`),
    R.join(', ')
  )([Taxon.propKeys.code, Taxon.propKeys.family, Taxon.propKeys.genus, Taxon.propKeys.scientificName])

  const select =
    `SELECT
          ${propsFields}
          ${R.isEmpty(vernacularNamesSubSelects) ? '' : `, ${vernacularNamesSubSelects}`}
      FROM
          ${getSurveyDBSchema(surveyId)}.taxon t
      WHERE
          t.taxonomy_uuid = $1
      ORDER BY
          ${DbUtils.getPropColCombined(Taxon.propKeys.family, draft, 't.')},
          ${DbUtils.getPropColCombined(Taxon.propKeys.scientificName, draft, 't.')}`

  return new DbUtils.QueryStream(DbUtils.formatQuery(select, [taxonomyUuid]))
}

const findTaxaByCondition = async (surveyId, taxonomyUuid, whereCondition, searchValue, orderByProp, draft, client) =>
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

export const fetchTaxonByCode = async (surveyId, taxonomyUuid, code, draft = false, client = db) => {
  const searchValue = toSearchValue(code)
  const filterCondition = searchValue ? DbUtils.getPropFilterCondition(Taxon.propKeys.code, draft) : ''

  const taxa = await findTaxaByCondition(surveyId, taxonomyUuid, filterCondition, searchValue, Taxon.propKeys.code, draft, client)
  return R.head(taxa)
}

const findTaxaByPropLike = async (surveyId,
                                  taxonomyUuid,
                                  filterProp,
                                  filterValue,
                                  draft = false,
                                  client = db) => {
  const searchValue = toSearchValue(filterValue)
  const filterCondition = searchValue ? DbUtils.getPropFilterCondition(filterProp, draft) : ''
  return await findTaxaByCondition(surveyId, taxonomyUuid, filterCondition, searchValue, filterProp, draft, client)
}

export const findTaxaByCode = async (surveyId,
                                     taxonomyUuid,
                                     filterValue,
                                     draft = false,
                                     client = db) =>
  await findTaxaByPropLike(surveyId, taxonomyUuid, Taxon.propKeys.code, `${filterValue}*`, draft, client)

export const findTaxaByScientificName = async (surveyId,
                                               taxonomyUuid,
                                               filterValue,
                                               draft = false,
                                               client = db) =>
  await findTaxaByPropLike(surveyId, taxonomyUuid, Taxon.propKeys.scientificName, `*${filterValue}*`, draft, client)

export const findTaxaByCodeOrScientificName = async (surveyId, taxonomyUuid, filterValue, draft = false, client = db) => {

  const searchValue = toSearchValue(`*${filterValue}*`)
  const whereCondition = `
    ${DbUtils.getPropFilterCondition(Taxon.propKeys.scientificName, draft)} 
     OR  
    ${DbUtils.getPropFilterCondition(Taxon.propKeys.code, draft)}
    `

  return await findTaxaByCondition(surveyId, taxonomyUuid, whereCondition, searchValue, Taxon.propKeys.scientificName, draft, client)
}

export const findTaxaByVernacularName = async (surveyId,
                                               taxonomyUuid,
                                               filterValue,
                                               draft = false,
                                               client = db) => {
  const searchValue = toSearchValue(`*${filterValue}*`)
  const filterCondition = searchValue ? DbUtils.getPropFilterCondition(TaxonVernacularName.keysProps.name, draft, 'vn.') : ''

  return await client.map(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${getSurveyDBSchema(surveyId)}.taxon t
       LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
       ON vn.taxon_uuid = t.uuid
     WHERE t.taxonomy_uuid = $/taxonomyUuid/ 
      AND ${filterCondition}
     ORDER BY ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.name, draft, 'vn.')} ASC
     LIMIT 20`,
    { taxonomyUuid, searchValue },
    record => dbTransformCallback(record, draft, true)
  )
}

export const fetchTaxonVernacularNameByUuid = async (surveyId, uuid, draft = false, client = db) =>
  await client.one(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${getSurveyDBSchema(surveyId)}.taxon t
       LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
       ON vn.taxon_uuid = t.uuid
     WHERE vn.uuid = $1`,
    [uuid],
    record => dbTransformCallback(record, draft, true)
  )

export const fetchTaxonByUuid = async (surveyId, uuid, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxon
     WHERE uuid = $1
    `
    , [uuid],
    record => dbTransformCallback(record, draft, true)
  )

// ============== Index
export const fetchIndex = async (surveyId, draft = false, client = db) =>
  await client.map(`
    SELECT
      t.taxonomy_uuid,
      t.uuid,
      t.props,
      t.props_draft,
      v.vernacular_names
    FROM
      ${getSurveyDBSchema(surveyId)}.taxon t
    
    ${draft ? '' : `--exclude not published taxonomies if not draft
      JOIN ${getSurveyDBSchema(surveyId)}.taxonomy
        ON t.taxonomy_uuid = taxonomy.uuid 
        AND taxonomy.props <> '{}'::jsonb`}
    LEFT OUTER JOIN
      (
        SELECT
          v.taxon_uuid,
          json_agg( json_build_object(${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.name, draft, 'v.')}, v.uuid::text) ) AS vernacular_names
        FROM
          ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name v
            
        ${draft ? '' : `--exclude not published vernacular names if not draft
          WHERE v.props <> '{}'::jsonb`}  
        GROUP BY
          v.taxon_uuid ) v
    ON
      v.taxon_uuid = t.uuid
    `,
    [],
    indexItem => dbTransformCallback(indexItem, draft, true)
  )

// ============== UPDATE

export const updateTaxonomyProp = async (surveyId, taxonomyUuid, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'taxonomy', taxonomyUuid, key, value, client)

export const updateTaxon = async (surveyId, taxon, client = db) =>
  await client.batch([
    client.none(
      `UPDATE ${getSurveyDBSchema(surveyId)}.taxon
       SET props_draft = $2
       WHERE uuid = $1`,
      [Taxon.getUuid(taxon), Taxon.getProps(taxon)]
    ),
    ..._insertOrUpdateVernacularNames(surveyId, Taxon.getUuid(taxon), Taxon.getVernacularNames(taxon), client)
  ])

export const updateTaxa = async (surveyId, taxa, client = db) =>
  await client.batch(taxa.map(
    taxon => updateTaxon(surveyId, taxon, client)
  ))

// ============== DELETE

export const deleteTaxonomy = async (surveyId, taxonomyUuid, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'taxonomy', taxonomyUuid, client)

export const deleteDraftTaxaByTaxonomyUuid = async (surveyId, taxonomyUuid, client = db) =>
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
