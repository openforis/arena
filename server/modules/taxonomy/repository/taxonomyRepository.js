import * as R from 'ramda'
import pgPromise from 'pg-promise'
import * as toSnakeCase from 'to-snake-case'

import { Objects } from '@openforis/arena-core'

import { Schemata } from '@common/model/db'

import * as A from '@core/arena'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import * as DB from '@server/db'
import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  dbTransformCallback,
} from '../../survey/repository/surveySchemaRepositoryUtils'

const searchTypes = {
  equals: 'equals',
  includes: 'includes',
  startsWith: 'startsWith',
}

const searchValueProcessorByType = {
  [searchTypes.equals]: A.identity,
  [searchTypes.includes]: (value) => `%${value}%`,
  [searchTypes.startsWith]: (value) => `${value}%`,
}

const getTaxonVernacularNameSelectFields = (draft) => `
  t.*,
  vn.uuid AS vernacular_name_uuid,
  ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.name, draft, 'vn.')} AS vernacular_name,
  ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.lang, draft, 'vn.')} AS vernacular_language`

// ============== CREATE

export const insertTaxonomy = async ({ surveyId, taxonomy, backup = false }, client = db) => {
  const { props, propsDraft } = Taxonomy.getPropsAndPropsDraft({ backup })(taxonomy)
  return client.one(
    `
        INSERT INTO ${getSurveyDBSchema(surveyId)}.taxonomy (uuid, props, props_draft)
        VALUES ($1, $2, $3)
        RETURNING *`,
    [Taxonomy.getUuid(taxonomy), props, propsDraft],
    (record) => dbTransformCallback(record, true, true)
  )
}

/**
 * Inserts or updated vernacular names into the specified taxon.
 * The vernacularNames parameter is an object indexed by language.
 * Each value is an array of TaxonVernacularName objects.
 * E.g.
 * ```
 * {
 *   'swa': [TaxonVernacularNameObject1, TaxonVernacularNameObject2],
 *   'eng': [TaxonVernacularNameObject3, TaxonVernacularNameObject4]
 * }
 * ```
 * where every TaxonVernacularNameObject is like this:
 * ```
 * {
 *   lang: 'eng',
 *   name: 'English Name'
 * }
 * ```.
 *
 * @param {!object} params - The search parameters.
 * @param {!number} [params.surveyId] - The ID of the survey.
 * @param {!string} [params.taxonUuid] - The UUID of the taxon.
 * @param {!object} [params.vernacularNames] - The vernacular names indexed by language code.
 * @param {pgPromise.IDatabase} [params.client=db] - The database client.
 * @returns {Array.<Promise>} - The result promises.
 */
const _insertOrUpdateVernacularNames = ({ surveyId, taxonUuid, vernacularNames, backup = false, client = db }) =>
  A.pipe(
    R.values,
    R.flatten,
    R.map((vernacularName) => {
      const { props, propsDraft } = TaxonVernacularName.getPropsAndPropsDraft({ backup })(vernacularName)
      return client.none(
        `INSERT INTO 
         ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name (uuid, taxon_uuid, props, props_draft)
      VALUES 
        ($1, $2, $3, $4)
      ON CONFLICT (uuid) DO UPDATE SET
        props = ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name.props || $3,
        props_draft = ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name.props_draft || $4
      `,
        [TaxonVernacularName.getUuid(vernacularName), taxonUuid, props, propsDraft]
      )
    })
  )(vernacularNames)

const insertTaxon = async ({ surveyId, taxon, backup = false, client = db }) => {
  const { props, propsDraft } = Taxon.getPropsAndPropsDraft({ backup })(taxon)

  return client.batch([
    client.none(
      `INSERT INTO ${getSurveyDBSchema(surveyId)}.taxon (uuid, taxonomy_uuid, props, props_draft)
       VALUES ($1, $2, $3, $4)`,
      [Taxon.getUuid(taxon), Taxon.getTaxonomyUuid(taxon), props, propsDraft]
    ),
    ..._insertOrUpdateVernacularNames({
      surveyId,
      taxonUuid: Taxon.getUuid(taxon),
      vernacularNames: Taxon.getVernacularNames(taxon),
      backup,
      client,
    }),
  ])
}

export const insertTaxa = async ({ surveyId, taxa, backup = false, client = db }) =>
  client.batch(taxa.map((taxon) => insertTaxon({ surveyId, taxon, backup, client })))

// ============== READ

export const fetchTaxonomyByUuid = async (surveyId, uuid, draft = false, client = db) =>
  client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxonomy
     WHERE uuid = $1`,
    [uuid],
    (record) => dbTransformCallback(record, draft, true)
  )

export const fetchTaxonomiesBySurveyId = async (
  { surveyId, draft = false, backup = false, limit = null, offset = 0, search = null },
  client = db
) => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  const propColName = DbUtils.getPropColCombined(Taxonomy.keysProps.name, draft)
  const propColDescription = DbUtils.getPropColCombined(Taxonomy.keysProps.descriptions, draft)

  const whereConditions = []
  if (search) {
    whereConditions.push(
      `${propColName} ILIKE $/search/
        OR 
      EXISTS (
        SELECT FROM jsonb_each_text(coalesce((${propColDescription})::jsonb, '{}'::jsonb))
        WHERE value ILIKE $/search/
      )`
    )
  }
  if (!backup && !draft) {
    // exclude not published (draft) taxonomies
    whereConditions.push(
      DbUtils.getPublishedCondition({ draft: false, tableAlias: 't' }),
      DbUtils.getPublishedCondition({ draft: false, tableAlias: 'tt' })
    )
  }

  return client.map(
    `SELECT t.*, COUNT(tt.*) AS taxa_count
     FROM ${schema}.taxonomy t
     LEFT JOIN ${schema}.taxon tt 
       ON tt.taxonomy_uuid = t.uuid
     ${DbUtils.getWhereClause(...whereConditions)}
     GROUP BY t.id
     ORDER BY ${DbUtils.getPropColCombined(Taxonomy.keysProps.name, draft, 't.')}, id
     LIMIT ${limit ? `$/limit/` : 'ALL'}
     ${A.isNull(offset) ? '' : 'OFFSET $/offset/'}`,
    {
      limit,
      offset,
      search: `%${search}%`,
    },
    (record) => DB.transformCallback(record, draft, true, backup)
  )
}

export const countTaxonomiesBySurveyId = async ({ surveyId }, client = db) =>
  client.one(
    `
      SELECT COUNT(*) 
      FROM ${getSurveyDBSchema(surveyId)}.taxonomy`,
    [],
    (r) => parseInt(r.count, 10)
  )

export const countTaxaBySurveyId = async ({ surveyId, draft = false }, client = db) => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  const whereCondition = draft ? '' : `WHERE t.props <> '{}'::jsonb`
  return client.one(
    `SELECT COUNT(*) 
    FROM ${schema}.taxon t
    ${whereCondition}
    `,
    [],
    (r) => Number(r.count)
  )
}

export const countTaxaByTaxonomyUuid = async (surveyId, taxonomyUuid, draft = false, client = db) => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  const publishedCondition = draft ? '' : `AND t.props <> '{}'::jsonb`
  return client.one(
    `
      SELECT COUNT(*) 
      FROM ${schema}.taxon t
      WHERE t.taxonomy_uuid = $1
      ${publishedCondition}`,
    [taxonomyUuid],
    (r) => parseInt(r.count, 10)
  )
}

export const fetchTaxa = async (
  { surveyId, taxonomyUuid = null, draft = false, backup = false, limit = null, offset = 0 },
  client = db
) =>
  client.map(
    `SELECT t.*
    FROM
        ${getSurveyDBSchema(surveyId)}.taxon t
    ${
      !backup && !draft
        ? `--exclude not published taxonomies if not draft
      JOIN ${getSurveyDBSchema(surveyId)}.taxonomy
        ON t.taxonomy_uuid = taxonomy.uuid 
        AND taxonomy.props <> '{}'::jsonb`
        : ''
    }
    ORDER BY
        t.id
    LIMIT ${limit ? limit : 'ALL'} 
    OFFSET $/offset/
    `,
    { taxonomyUuid, offset },
    (record) => DB.transformCallback(record, draft, true, backup)
  )

export const fetchTaxaWithVernacularNames = async (
  { surveyId, taxonomyUuid = null, draft = false, backup = false, limit = null, offset = 0 },
  client = db
) =>
  client.map(
    `
      WITH vernacular_names AS (
        SELECT
          vn.taxon_uuid,
          (vn.props || vn.props_draft)->>'${TaxonVernacularName.keysProps.lang}' as lang,
          array_agg(
            json_build_object(
              '${TaxonVernacularName.keys.uuid}', vn.uuid,
              '${TaxonVernacularName.keys.props}', vn.props${draft ? ' || vn.props_draft' : ''}
            )
          ) as names
        FROM ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn
        ${
          !backup && !draft
            ? `--exclude not published vernacular names if not draft
          WHERE vn.props <> '{}'::jsonb`
            : ''
        }
        GROUP BY vn.taxon_uuid, (vn.props || vn.props_draft)->>'${TaxonVernacularName.keysProps.lang}'
      )

      SELECT
          t.*,
          COALESCE(
            jsonb_object_agg(
              vn.lang,
              vn.names
            ) FILTER (WHERE vn.lang IS NOT NULL),
            '{}'
          ) as vernacular_names,
        ROW_NUMBER () OVER (partition by t.taxonomy_uuid order by t.id) AS index
      FROM
          ${getSurveyDBSchema(surveyId)}.taxon t
      ${
        !backup && !draft
          ? `--exclude not published taxonomies if not draft
        JOIN ${getSurveyDBSchema(surveyId)}.taxonomy
          ON t.taxonomy_uuid = taxonomy.uuid 
          AND taxonomy.props <> '{}'::jsonb`
          : ''
      }
      LEFT OUTER JOIN
          vernacular_names vn
      ON
          vn.taxon_uuid = t.uuid
      ${taxonomyUuid ? 'WHERE t.taxonomy_uuid = $/taxonomyUuid/' : ''}
      GROUP BY
          t.taxonomy_uuid, t.id
      ORDER BY
          t.id
      LIMIT ${limit ? limit : 'ALL'} 
      OFFSET $/offset/
    `,
    { taxonomyUuid, offset },
    (row) => {
      const rowTransformed = DB.transformCallback(row, draft, true, backup)
      Objects.setInPath({
        obj: rowTransformed,
        path: [Taxon.keys.props, Taxon.propKeys.index],
        value: Number(row.index),
      })
      delete rowTransformed['index']
      return rowTransformed
    }
  )

export const fetchTaxaWithVernacularNamesStream = ({
  surveyId,
  taxonomyUuid,
  vernacularLangCodes,
  extraPropsDefs,
  draft = false,
}) => {
  const vernacularNamesSubSelects = A.pipe(
    R.map(
      (langCode) =>
        `(SELECT
            string_agg(${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.name, draft, 'vn.')}, '${
              TaxonVernacularName.NAMES_SEPARATOR
            }') as names
        FROM
            ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn
        WHERE
            vn.taxon_uuid = t.uuid
            AND ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.lang, draft, 'vn.')} = '${langCode}'
       ) AS ${langCode}`
    ),
    R.join(', ')
  )(vernacularLangCodes)

  const propsFields = A.pipe(
    R.map((prop) => `${DbUtils.getPropColCombined(prop, draft, 't.')} AS ${toSnakeCase(prop)}`),
    R.join(', ')
  )([Taxon.propKeys.code, Taxon.propKeys.family, Taxon.propKeys.genus, Taxon.propKeys.scientificName])

  const extraPropsFields = Object.keys(extraPropsDefs)
    .map(
      (extraProp) =>
        `(t.props${draft ? ` || t.props_draft` : ''})#>>'{${Taxon.propKeys.extra},${extraProp}}' AS ${extraProp}`
    )
    .join(', ')

  const select = `SELECT
          ${propsFields}
          ${A.isEmpty(extraPropsFields) ? '' : `, ${extraPropsFields}`}
          ${A.isEmpty(vernacularNamesSubSelects) ? '' : `, ${vernacularNamesSubSelects}`}
      FROM
          ${getSurveyDBSchema(surveyId)}.taxon t
      WHERE
          t.taxonomy_uuid = $1
      ORDER BY t.id`

  return new DbUtils.QueryStream(DbUtils.formatQuery(select, [taxonomyUuid]))
}

const findTaxaByCondition = async (surveyId, taxonomyUuid, whereCondition, searchValue, orderByProp, draft, client) =>
  client.map(
    `SELECT *
       FROM ${getSurveyDBSchema(surveyId)}.taxon
       WHERE taxonomy_uuid = $/taxonomyUuid/ 
         ${whereCondition ? ` AND (${whereCondition})` : ''}
       ORDER BY ${DbUtils.getPropColCombined(orderByProp, draft)} ASC
       LIMIT 100`,
    { taxonomyUuid, searchValue },
    (taxon) => dbTransformCallback(taxon, draft, true)
  )

const toSearchValue = (filterValue, searchType = searchTypes.equals) => {
  if (A.isEmpty(filterValue)) return null
  let searchValue = String(filterValue).trim().toLowerCase().replace(/\*/g, '%')
  searchValue = searchValueProcessorByType[searchType](searchValue)
  return searchValue
}

export const fetchTaxonByCode = async (surveyId, taxonomyUuid, code, draft = false, client = db) => {
  const searchValue = toSearchValue(code)
  const filterCondition = searchValue ? DbUtils.getPropFilterCondition(Taxon.propKeys.code, draft) : ''

  const taxa = await findTaxaByCondition(
    surveyId,
    taxonomyUuid,
    filterCondition,
    searchValue,
    Taxon.propKeys.code,
    draft,
    client
  )
  return R.head(taxa)
}

const findTaxaByPropLike = async (surveyId, taxonomyUuid, filterProp, filterValue, draft = false, client = db) => {
  const searchValue = toSearchValue(filterValue)
  const filterCondition = searchValue ? DbUtils.getPropFilterCondition(filterProp, draft) : ''
  return findTaxaByCondition(surveyId, taxonomyUuid, filterCondition, searchValue, filterProp, draft, client)
}

export const findTaxaByCode = async (surveyId, taxonomyUuid, filterValue, draft = false, client = db) =>
  findTaxaByPropLike(surveyId, taxonomyUuid, Taxon.propKeys.code, `${filterValue}*`, draft, client)

export const findTaxaByScientificName = async (surveyId, taxonomyUuid, filterValue, draft = false, client = db) =>
  findTaxaByPropLike(surveyId, taxonomyUuid, Taxon.propKeys.scientificName, `*${filterValue}*`, draft, client)

export const findTaxaByCodeOrScientificName = async (
  surveyId,
  taxonomyUuid,
  filterValue,
  draft = false,
  client = db
) => {
  const searchValue = toSearchValue(filterValue, searchTypes.includes)
  const whereCondition = searchValue
    ? `${DbUtils.getPropFilterCondition(Taxon.propKeys.scientificName, draft)} 
     OR  
    ${DbUtils.getPropFilterCondition(Taxon.propKeys.code, draft)}`
    : null

  return findTaxaByCondition(
    surveyId,
    taxonomyUuid,
    whereCondition,
    searchValue,
    Taxon.propKeys.scientificName,
    draft,
    client
  )
}

export const findTaxaByVernacularName = async (surveyId, taxonomyUuid, filterValue, draft = false, client = db) => {
  const searchValue = toSearchValue(filterValue, searchTypes.includes)
  const filterCondition = searchValue
    ? DbUtils.getPropFilterCondition(TaxonVernacularName.keysProps.name, draft, 'vn.')
    : ''

  return client.map(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
       JOIN ${getSurveyDBSchema(surveyId)}.taxon t
       ON vn.taxon_uuid = t.uuid
     WHERE t.taxonomy_uuid = $/taxonomyUuid/ 
      AND ${filterCondition}
     ORDER BY 
      ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.name, draft, 'vn.')} ASC,
      ${DbUtils.getPropColCombined(Taxon.propKeys.scientificName, draft, 't.')} ASC
     LIMIT 20`,
    { taxonomyUuid, searchValue },
    (record) => dbTransformCallback(record, draft, true)
  )
}

export const fetchTaxonVernacularNameByUuid = async (surveyId, uuid, draft = false, client = db) =>
  client.one(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${getSurveyDBSchema(surveyId)}.taxon t
       LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.taxon_vernacular_name vn 
       ON vn.taxon_uuid = t.uuid
     WHERE vn.uuid = $1`,
    [uuid],
    (record) => dbTransformCallback(record, draft, true)
  )

export const fetchTaxonByUuid = async (surveyId, uuid, draft = false, client = db) =>
  client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.taxon
     WHERE uuid = $1
    `,
    [uuid],
    (record) => dbTransformCallback(record, draft, true)
  )

// ============== UPDATE

export const updateTaxonomyProp = async (surveyId, taxonomyUuid, key, value, client = db) =>
  updateSurveySchemaTableProp(surveyId, 'taxonomy', taxonomyUuid, key, value, client)

export const updateTaxonProps = async ({ surveyId, taxon }, client = db) =>
  client.none(
    `UPDATE ${getSurveyDBSchema(surveyId)}.taxon
     SET props_draft = $2
     WHERE uuid = $1`,
    [Taxon.getUuid(taxon), Taxon.getProps(taxon)]
  )

export const updateTaxonAndVernacularNames = async (surveyId, taxon, client = db) =>
  client.batch([
    updateTaxonProps({ surveyId, taxon }, client),
    ..._insertOrUpdateVernacularNames({
      surveyId,
      taxonUuid: Taxon.getUuid(taxon),
      vernacularNames: Taxon.getVernacularNames(taxon),
      client,
    }),
  ])

export const updateTaxa = async (surveyId, taxa, client = db) =>
  client.batch(taxa.map((taxon) => updateTaxonAndVernacularNames(surveyId, taxon, client)))

export const updateTaxaProps = async ({ surveyId, taxa }, client = db) =>
  client.batch(taxa.map((taxon) => updateTaxonProps({ surveyId, taxon }, client)))

// ============== DELETE

export const deleteTaxonomy = async (surveyId, taxonomyUuid, client = db) =>
  deleteSurveySchemaTableRecord(surveyId, 'taxonomy', taxonomyUuid, client)

export const deleteDraftTaxaByTaxonomyUuid = async (surveyId, taxonomyUuid, client = db) =>
  client.none(
    `DELETE FROM ${getSurveyDBSchema(surveyId)}.taxon
     WHERE taxonomy_uuid = $1
       AND props::text = '{}'::text`,
    [taxonomyUuid]
  )
