import toSnakeCase from 'to-snake-case'

import type { ArenaTaxon, ArenaTaxonomy, ArenaVernacularName } from '@openforis/arena-core'
import { Objects } from '@openforis/arena-core'

import { Schemata } from '@common/model/db'
import * as A from '@core/arena'
import type { ExtraPropDefItems } from '@core/survey/extraPropDef'
import * as Taxon from '@core/survey/taxon'
import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as DB from '@server/db'
import { db, DbClient } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import {
  deleteSurveySchemaTableRecord,
  updateSurveySchemaTableProp,
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

// taxa follow their position in the last imported file; the ones without it (e.g. added later) go last
const getTaxaOrderBy = (draft: boolean) =>
  `(${DbUtils.getPropColCombined(Taxon.propKeys.position, draft, 't.')})::integer NULLS LAST, t.id`

const getTaxonVernacularNameSelectFields = (draft: boolean) => `
  t.*,
  vn.uuid AS vernacular_name_uuid,
  ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.name, draft, 'vn.')} AS vernacular_name,
  ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.lang, draft, 'vn.')} AS vernacular_language`

// ============== CREATE

export const insertTaxonomy = (
  { surveyId, taxonomy, backup = false }: { surveyId: number; taxonomy: ArenaTaxonomy; backup?: boolean },
  client: DbClient = db
) => {
  const { props, propsDraft } = Taxonomy.getPropsAndPropsDraft({ backup })(taxonomy)
  return client.one(
    `
        INSERT INTO ${Schemata.getSchemaSurvey(surveyId)}.taxonomy (uuid, props, props_draft)
        VALUES ($1, $2, $3)
        RETURNING *`,
    [Taxonomy.getUuid(taxonomy), props, propsDraft],
    (record) => DB.transformCallback(record, true, true)
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
 * @param {!object} params - The search parameters.
 * @param {!string} [params.taxonUuid] - The UUID of the taxon.
 * @param {!object} [params.vernacularNames] - The vernacular names indexed by language code.
 * @param {boolean} [params.backup] - Whether the vernacular names come from a survey backup (props are published).
 * @returns {Array.<function(): Promise<null>>} - The functions running the insert/update queries (not started yet):
 * to be run with DbUtils.runQueries.
 */
const _insertOrUpdateVernacularNames = ({
  surveyId,
  taxonUuid,
  vernacularNames,
  backup = false,
  client = db,
}: {
  surveyId: number
  taxonUuid: string
  vernacularNames: Record<string, ArenaVernacularName[]>
  backup?: boolean
  client?: DbClient
}) =>
  A.pipe(
    A.values,
    A.flatten,
    A.map((vernacularName) => () => {
      const { props, propsDraft } = TaxonVernacularName.getPropsAndPropsDraft({ backup })(vernacularName)
      return client.none(
        `INSERT INTO 
         ${Schemata.getSchemaSurvey(surveyId)}.taxon_vernacular_name (uuid, taxon_uuid, props, props_draft)
      VALUES 
        ($1, $2, $3, $4)
      ON CONFLICT (uuid) DO UPDATE SET
        props = ${Schemata.getSchemaSurvey(surveyId)}.taxon_vernacular_name.props || $3,
        props_draft = ${Schemata.getSchemaSurvey(surveyId)}.taxon_vernacular_name.props_draft || $4
      `,
        [TaxonVernacularName.getUuid(vernacularName), taxonUuid, props, propsDraft]
      )
    })
  )(vernacularNames)

const insertTaxon = async ({
  surveyId,
  taxon,
  backup = false,
  client = db,
}: {
  surveyId: number
  taxon: ArenaTaxon
  backup?: boolean
  client?: DbClient
}) => {
  const { props, propsDraft } = Taxon.getPropsAndPropsDraft({ backup })(taxon)

  // insert the taxon first: the vernacular names reference it
  await client.none(
    `INSERT INTO ${Schemata.getSchemaSurvey(surveyId)}.taxon (uuid, taxonomy_uuid, props, props_draft)
       VALUES ($1, $2, $3, $4)`,
    [Taxon.getUuid(taxon), Taxon.getTaxonomyUuid(taxon), props, propsDraft]
  )
  await DbUtils.runQueries(
    client,
    _insertOrUpdateVernacularNames({
      surveyId,
      taxonUuid: Taxon.getUuid(taxon),
      vernacularNames: Taxon.getVernacularNames(taxon),
      backup,
      client,
    })
  )
}

export const insertTaxa = ({
  surveyId,
  taxa,
  backup = false,
  client = db,
}: {
  surveyId: number
  taxa: ArenaTaxon[]
  backup?: boolean
  client?: DbClient
}) =>
  DbUtils.runQueries(
    client,
    taxa.map((taxon) => () => insertTaxon({ surveyId, taxon, backup, client }))
  )

export const cloneTaxonomyFromSurvey = async (
  {
    sourceSurveyId,
    targetSurveyId,
    taxonomyUuid,
  }: { sourceSurveyId: number; targetSurveyId: number; taxonomyUuid: string },
  client: DbClient = db
) => {
  const sourceSchema = Schemata.getSchemaSurvey(sourceSurveyId)
  const targetSchema = Schemata.getSchemaSurvey(targetSurveyId)

  await client.none(
    `
    INSERT INTO ${targetSchema}.taxonomy (uuid, props, props_draft)
    SELECT uuid, '{}'::jsonb, COALESCE(props, '{}'::jsonb) || COALESCE(props_draft, '{}'::jsonb)
    FROM ${sourceSchema}.taxonomy
    WHERE uuid = $1
  `,
    [taxonomyUuid]
  )

  await client.none(
    `
    INSERT INTO ${targetSchema}.taxon (uuid, taxonomy_uuid, props, props_draft)
    SELECT uuid, taxonomy_uuid, '{}'::jsonb, COALESCE(props, '{}'::jsonb) || COALESCE(props_draft, '{}'::jsonb)
    FROM ${sourceSchema}.taxon
    WHERE taxonomy_uuid = $1
  `,
    [taxonomyUuid]
  )

  await client.none(
    `
    INSERT INTO ${targetSchema}.taxon_vernacular_name (uuid, taxon_uuid, props, props_draft)
    SELECT vn.uuid, vn.taxon_uuid, '{}'::jsonb, COALESCE(vn.props, '{}'::jsonb) || COALESCE(vn.props_draft, '{}'::jsonb)
    FROM ${sourceSchema}.taxon_vernacular_name vn
    JOIN ${sourceSchema}.taxon t ON t.uuid = vn.taxon_uuid
    WHERE t.taxonomy_uuid = $1
  `,
    [taxonomyUuid]
  )
}

// ============== READ

export const fetchTaxonomyByUuid = (surveyId: number, uuid: string, draft: boolean = false, client: DbClient = db) =>
  client.one(
    `SELECT * FROM ${Schemata.getSchemaSurvey(surveyId)}.taxonomy
     WHERE uuid = $1`,
    [uuid],
    (record) => DB.transformCallback(record, draft, true)
  )

export const fetchTaxonomiesBySurveyId = (
  {
    surveyId,
    draft = false,
    backup = false,
    limit = null,
    offset = 0,
    search = null,
  }: {
    surveyId: number
    draft?: boolean
    backup?: boolean
    limit?: number | null
    offset?: number
    search?: string | null
  },
  client: DbClient = db
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

export const countTaxonomiesBySurveyId = ({ surveyId }: { surveyId: number }, client: DbClient = db) =>
  client.one(
    `
      SELECT COUNT(*) 
      FROM ${Schemata.getSchemaSurvey(surveyId)}.taxonomy`,
    [],
    (r) => Number.parseInt(r.count, 10)
  )

export const countTaxaBySurveyId = (
  { surveyId, draft = false }: { surveyId: number; draft?: boolean },
  client: DbClient = db
) => {
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

export const countTaxaByTaxonomyUuid = (
  surveyId: number,
  taxonomyUuid: string,
  draft: boolean = false,
  client: DbClient = db
) => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  const publishedCondition = draft ? '' : `AND t.props <> '{}'::jsonb`
  return client.one(
    `
      SELECT COUNT(*) 
      FROM ${schema}.taxon t
      WHERE t.taxonomy_uuid = $1
      ${publishedCondition}`,
    [taxonomyUuid],
    (r) => Number.parseInt(r.count, 10)
  )
}

const fetchTaxaCountIndexedByTaxonomyUuid = async (
  { surveyId, draft = false }: { surveyId: number; draft?: boolean },
  client: DbClient = db
): Promise<Record<string, number>> => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  const propsPublishedCondition = DbUtils.getPropsPublishedCondition({ draft, tableAlias: 't' })
  const whereClause = propsPublishedCondition ? `WHERE ${propsPublishedCondition}` : ''
  const counts = await client.any(
    `SELECT t.taxonomy_uuid, COUNT(t.*) 
    FROM ${schema}.taxon t
    ${whereClause}
    GROUP BY t.taxonomy_uuid`
  )
  return counts.reduce((acc: Record<string, number>, row) => {
    acc[row.taxonomy_uuid] = Number(row.count)
    return acc
  }, {})
}

const fetchTaxonomyUuidsExceedingMaxItems = async (
  { surveyId, draft }: { surveyId: number; draft: boolean },
  client: DbClient
) => {
  const itemsCountIndexedByTaxonomyUuid = await fetchTaxaCountIndexedByTaxonomyUuid({ surveyId, draft }, client)
  return Object.entries(itemsCountIndexedByTaxonomyUuid).reduce((acc, [taxonomyUuid, count]) => {
    if (count > Taxonomy.maxTaxaInIndex) {
      acc.push(taxonomyUuid)
    }
    return acc
  }, [])
}

export const fetchTaxa = (
  {
    surveyId,
    taxonomyUuid = null,
    draft = false,
    backup = false,
    limit = null,
    offset = 0,
  }: {
    surveyId: number
    taxonomyUuid?: string
    draft?: boolean
    backup?: boolean
    limit?: number | null
    offset?: number
  },
  client: DbClient = db
) =>
  client.map(
    `SELECT t.*
    FROM
        ${Schemata.getSchemaSurvey(surveyId)}.taxon t
    ${
      !backup && !draft
        ? `--exclude not published taxonomies if not draft
      JOIN ${Schemata.getSchemaSurvey(surveyId)}.taxonomy
        ON t.taxonomy_uuid = taxonomy.uuid 
        AND taxonomy.props <> '{}'::jsonb`
        : ''
    }
    ORDER BY ${getTaxaOrderBy(draft)}
    LIMIT $/limit/
    OFFSET $/offset/
    `,
    { taxonomyUuid, limit: DbUtils.normalizeLimit(limit), offset: DbUtils.normalizeOffset(offset) },
    (record) => DB.transformCallback(record, draft, true, backup)
  )

export const fetchTaxaWithVernacularNames = async (
  {
    surveyId,
    taxonomyUuid = null,
    taxonUuid = null,
    draft = false,
    includeBigTaxonomies = true,
    backup = false,
    limit = null,
    offset = 0,
  }: {
    surveyId: number
    taxonomyUuid?: string
    taxonUuid?: string
    draft?: boolean
    includeBigTaxonomies?: boolean
    backup?: boolean
    limit?: number | null
    offset?: number
  },
  client: DbClient = db
) => {
  const taxonomyUuidsExceedingMaxItems = includeBigTaxonomies
    ? []
    : await fetchTaxonomyUuidsExceedingMaxItems({ surveyId, draft }, client)
  const allTaxonomiesIncluded = includeBigTaxonomies || taxonomyUuidsExceedingMaxItems.length === 0
  const whereConditions = []
  if (taxonomyUuid) {
    whereConditions.push('t.taxonomy_uuid = $/taxonomyUuid/')
  }
  if (!allTaxonomiesIncluded) {
    whereConditions.push('t.taxonomy_uuid NOT IN ($/excludedTaxonomyUuids:csv/)')
  }
  if (taxonUuid) {
    whereConditions.push('t.uuid = $/taxonUuid/')
  }
  const whereCondition = DbUtils.getWhereClause(...whereConditions)

  const queryParams: Record<string, unknown> = { taxonomyUuid, taxonUuid, limit, offset }
  if (!allTaxonomiesIncluded && taxonomyUuidsExceedingMaxItems.length > 0) {
    queryParams.excludedTaxonomyUuids = taxonomyUuidsExceedingMaxItems
  }
  return client.map(
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
        FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon_vernacular_name vn
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
        ROW_NUMBER () OVER (partition by t.taxonomy_uuid order by ${getTaxaOrderBy(draft)}) AS index
      FROM
          ${Schemata.getSchemaSurvey(surveyId)}.taxon t
      ${
        !backup && !draft
          ? `--exclude not published taxonomies if not draft
        JOIN ${Schemata.getSchemaSurvey(surveyId)}.taxonomy
          ON t.taxonomy_uuid = taxonomy.uuid 
          AND taxonomy.props <> '{}'::jsonb`
          : ''
      }
      LEFT OUTER JOIN
          vernacular_names vn
      ON
          vn.taxon_uuid = t.uuid
      ${whereCondition}
      GROUP BY
          t.taxonomy_uuid, t.id
      ORDER BY ${getTaxaOrderBy(draft)}
      LIMIT ${limit ? '$/limit/' : 'ALL'} 
      OFFSET $/offset/
    `,
    queryParams,
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
}

export const fetchTaxaWithVernacularNamesStream = ({
  surveyId,
  taxonomyUuid,
  vernacularLangCodes,
  extraPropsDefs,
  draft = false,
}: {
  surveyId: number
  taxonomyUuid: string
  vernacularLangCodes: string[]
  extraPropsDefs: ExtraPropDefItems
  draft?: boolean
}) => {
  // language codes and extra prop names are passed as parameters (values and quoted column aliases)
  const params = DbUtils.newQueryParams([taxonomyUuid])
  const vernacularNamesSubSelects = A.pipe(
    A.map(
      (langCode) =>
        `(SELECT
            string_agg(${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.name, draft, 'vn.')}, '${
              TaxonVernacularName.NAMES_SEPARATOR
            }') as names
        FROM
            ${Schemata.getSchemaSurvey(surveyId)}.taxon_vernacular_name vn
        WHERE
            vn.taxon_uuid = t.uuid
            AND ${DbUtils.getPropColCombined(TaxonVernacularName.keysProps.lang, draft, 'vn.')} = ${params.add(langCode)}
       ) AS ${params.add(langCode, ':name')}`
    ),
    A.join(', ')
  )(vernacularLangCodes)

  const propsFields = A.pipe(
    A.map((prop) => `${DbUtils.getPropColCombined(prop, draft, 't.')} AS ${toSnakeCase(prop)}`),
    A.join(', ')
  )([Taxon.propKeys.code, Taxon.propKeys.family, Taxon.propKeys.genus, Taxon.propKeys.scientificName])

  const propsCol = draft ? 't.props || t.props_draft' : 't.props'
  const extraPropsFields = Object.keys(extraPropsDefs)
    .map(
      (extraProp) =>
        `(${propsCol})#>>${params.add([Taxon.propKeys.extra, extraProp])}::text[] AS ${params.add(extraProp, ':name')}`
    )
    .join(', ')

  const select = `SELECT
          ${propsFields}
          ${A.isEmpty(extraPropsFields) ? '' : `, ${extraPropsFields}`}
          ${A.isEmpty(vernacularNamesSubSelects) ? '' : `, ${vernacularNamesSubSelects}`}
      FROM
          ${Schemata.getSchemaSurvey(surveyId)}.taxon t
      WHERE
          t.taxonomy_uuid = $1
      ORDER BY ${getTaxaOrderBy(draft)}`

  return new DbUtils.QueryStream(DbUtils.formatQuery(select, params.values))
}

const findTaxaByCondition = (
  surveyId: number,
  taxonomyUuid: string,
  whereCondition: string,
  searchValue: string | null,
  orderByProp: string,
  draft: boolean,
  client: DbClient
) =>
  client.map(
    `SELECT *
       FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon
       WHERE taxonomy_uuid = $/taxonomyUuid/ 
         ${whereCondition ? ` AND (${whereCondition})` : ''}
       ORDER BY ${DbUtils.getPropColCombined(orderByProp, draft)} ASC
       LIMIT 100`,
    { taxonomyUuid, searchValue },
    (taxon) => DB.transformCallback(taxon, draft, true)
  )

const toSearchValue = (filterValue: string, searchType = searchTypes.equals) => {
  if (A.isEmpty(filterValue)) return null
  let searchValue = String(filterValue).trim().toLowerCase().replaceAll('*', '%')
  searchValue = searchValueProcessorByType[searchType](searchValue)
  return searchValue
}

/**
 * Fetches the taxa having raw Excel cell objects among their props or extra props.
 * @returns {Promise<Array<{uuid: string, taxonomy_uuid: string, props: object, props_draft: object}>>} The taxa rows.
 */
export const fetchTaxaWithExcelCellObjects = ({ surveyId }: { surveyId: number }, client: DbClient = db) =>
  client.any(
    `SELECT uuid, taxonomy_uuid, props, props_draft
    FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon
    WHERE (props || props_draft) @? '$.**{1 to 2} ? (exists(@.richText) || exists(@.hyperlink) || exists(@.error) || exists(@.formula) || exists(@.sharedFormula))'
    ORDER BY id`
  )

/**
 * Checks if another taxon of the same taxonomy has the specified scientific name.
 * @param {object} params - The parameters.
 * @param {string} params.taxonUuid - The uuid of the taxon to exclude.
 * @returns {Promise<boolean>} True if the scientific name is already in use.
 */
export const existsOtherTaxonWithScientificName = (
  {
    surveyId,
    taxonomyUuid,
    taxonUuid,
    scientificName,
  }: { surveyId: number; taxonomyUuid: string; taxonUuid: string; scientificName: string },
  client: DbClient = db
) =>
  client.one(
    `SELECT EXISTS (
      SELECT 1 FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon
      WHERE taxonomy_uuid = $1 AND uuid <> $2 AND (props || props_draft)->>'${Taxon.propKeys.scientificName}' = $3
    )`,
    [taxonomyUuid, taxonUuid, scientificName],
    (row) => row.exists
  )

export const fetchTaxonByCode = async (
  surveyId: number,
  taxonomyUuid: string,
  code: string,
  draft: boolean = false,
  client: DbClient = db
) => {
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
  return A.head(taxa)
}

const findTaxaByPropLike = (
  surveyId: number,
  taxonomyUuid: string,
  filterProp: string,
  filterValue: string,
  draft: boolean = false,
  client: DbClient = db
) => {
  const searchValue = toSearchValue(filterValue)
  const filterCondition = searchValue ? DbUtils.getPropFilterCondition(filterProp, draft) : ''
  return findTaxaByCondition(surveyId, taxonomyUuid, filterCondition, searchValue, filterProp, draft, client)
}

export const findTaxaByCode = (
  surveyId: number,
  taxonomyUuid: string,
  filterValue: string,
  draft: boolean = false,
  client: DbClient = db
) => findTaxaByPropLike(surveyId, taxonomyUuid, Taxon.propKeys.code, `${filterValue}*`, draft, client)

export const findTaxaByScientificName = (
  surveyId: number,
  taxonomyUuid: string,
  filterValue: string,
  draft: boolean = false,
  client: DbClient = db
) => findTaxaByPropLike(surveyId, taxonomyUuid, Taxon.propKeys.scientificName, `*${filterValue}*`, draft, client)

export const findTaxaFilteringFields = ({
  surveyId,
  taxonomyUuid,
  filterFields,
  filterValue,
  orderByFields,
  draft = false,
  client = db,
}: {
  surveyId: number
  taxonomyUuid: string
  filterFields: string[]
  filterValue: string
  orderByFields: string[]
  draft?: boolean
  client?: DbClient
}) => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  const searchValue = toSearchValue(filterValue, searchTypes.includes)
  const tableAliasByField = {
    [TaxonVernacularName.keysProps.name]: 'vn',
    [Taxon.propKeys.code]: 't',
    [Taxon.propKeys.scientificName]: 't',
  }
  const filterCondition = searchValue
    ? filterFields.map((field) => DbUtils.getPropFilterCondition(field, draft, tableAliasByField[field])).join(' OR ')
    : ''
  const orderByConditions = orderByFields
    .map((field) => `${DbUtils.getPropColCombined(field, draft, tableAliasByField[field])} ASC`)
    .join(', ')

  const filteringByVernacularName = filterFields.includes(TaxonVernacularName.keysProps.name)
  const fromClause = filteringByVernacularName
    ? `${schema}.taxon_vernacular_name vn 
       JOIN ${schema}.taxon t
          ON vn.taxon_uuid = t.uuid`
    : `${schema}.taxon t`

  return client.map(
    `SELECT ${filteringByVernacularName ? getTaxonVernacularNameSelectFields(draft) : '*'}
     FROM ${fromClause}
     WHERE t.taxonomy_uuid = $/taxonomyUuid/ 
       ${filterCondition ? `AND ${filterCondition}` : ''}
     ORDER BY ${orderByConditions}
     LIMIT 100`,
    { taxonomyUuid, searchValue },
    (record) => DB.transformCallback(record, draft, true)
  )
}

export const findTaxaByCodeOrScientificName = (
  surveyId: number,
  taxonomyUuid: string,
  filterValue: string,
  draft: boolean = false,
  client: DbClient = db
) =>
  findTaxaFilteringFields({
    surveyId,
    taxonomyUuid,
    filterFields: [Taxon.propKeys.code, Taxon.propKeys.scientificName],
    filterValue,
    orderByFields: [Taxon.propKeys.scientificName],
    draft,
    client,
  })

export const findTaxaByVernacularName = (
  surveyId: number,
  taxonomyUuid: string,
  filterValue: string,
  draft: boolean = false,
  client: DbClient = db
) =>
  findTaxaFilteringFields({
    surveyId,
    taxonomyUuid,
    filterFields: [TaxonVernacularName.keysProps.name],
    filterValue,
    orderByFields: [TaxonVernacularName.keysProps.name, Taxon.propKeys.scientificName],
    draft,
    client,
  })

export const fetchTaxonVernacularNameByUuid = (
  surveyId: number,
  uuid: string,
  draft: boolean = false,
  client: DbClient = db
) =>
  client.one(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon t
       LEFT OUTER JOIN ${Schemata.getSchemaSurvey(surveyId)}.taxon_vernacular_name vn 
       ON vn.taxon_uuid = t.uuid
     WHERE vn.uuid = $1`,
    [uuid],
    (record) => DB.transformCallback(record, draft, true)
  )

export const fetchTaxaWithVernacularNamesByTaxonUuid = (
  {
    surveyId,
    taxonomyUuid,
    taxonUuid,
    draft = false,
  }: { surveyId: number; taxonomyUuid: string; taxonUuid: string; draft?: boolean },
  client: DbClient = db
) =>
  client.map(
    `SELECT ${getTaxonVernacularNameSelectFields(draft)}
     FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon_vernacular_name vn
       JOIN ${Schemata.getSchemaSurvey(surveyId)}.taxon t
          ON vn.taxon_uuid = t.uuid
     WHERE t.taxonomy_uuid = $/taxonomyUuid/
       AND t.uuid = $/taxonUuid/`,
    { taxonomyUuid, taxonUuid },
    (record) => DB.transformCallback(record, draft, true)
  )

export const fetchTaxonByUuid = (surveyId: number, uuid: string, draft: boolean = false, client: DbClient = db) =>
  client.one(
    `SELECT * FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon
     WHERE uuid = $1
    `,
    [uuid],
    (record) => DB.transformCallback(record, draft, true)
  )

export const fetchTaxonWithVernacularNamesByUuid = async (
  {
    surveyId,
    taxonomyUuid,
    taxonUuid,
    draft = false,
  }: { surveyId: number; taxonomyUuid: string; taxonUuid: string; draft?: boolean },
  client: DbClient = db
) => {
  const taxa = await fetchTaxaWithVernacularNames({ surveyId, taxonomyUuid, taxonUuid, draft }, client)
  return A.head(taxa)
}

export const fetchTaxonWithVernacularNamesByCode = async (
  {
    surveyId,
    taxonomyUuid,
    taxonCode,
    draft = false,
  }: { surveyId: number; taxonomyUuid: string; taxonCode: string; draft?: boolean },
  client: DbClient = db
) => {
  const taxon = await fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, draft, client)
  const taxonUuid = Taxon.getUuid(taxon)
  if (!taxonUuid) return null

  return fetchTaxonWithVernacularNamesByUuid({ surveyId, taxonomyUuid, taxonUuid, draft }, client)
}

export const fetchPublishedVernacularNameUuids = (
  { surveyId, taxonomyUuid }: { surveyId: number; taxonomyUuid: string },
  client: DbClient = db
) =>
  client.map(
    `SELECT vn.uuid
     FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon_vernacular_name vn
       JOIN ${Schemata.getSchemaSurvey(surveyId)}.taxon t ON t.uuid = vn.taxon_uuid
     WHERE t.taxonomy_uuid = $1
       AND vn.props <> '{}'::jsonb`,
    [taxonomyUuid],
    (row) => row.uuid
  )

// ============== UPDATE

export const updateTaxonomyProp = (
  surveyId: number,
  taxonomyUuid: string,
  key: string,
  value: unknown,
  client: DbClient = db
) => updateSurveySchemaTableProp(surveyId, 'taxonomy', taxonomyUuid, key, value, client)

export const updateTaxonProps = ({ surveyId, taxon }: { surveyId: number; taxon: ArenaTaxon }, client: DbClient = db) =>
  client.none(
    `UPDATE ${Schemata.getSchemaSurvey(surveyId)}.taxon
     SET props_draft = $2
     WHERE uuid = $1`,
    [Taxon.getUuid(taxon), Taxon.getProps(taxon)]
  )

export const updateTaxonAndVernacularNames = (surveyId: number, taxon: ArenaTaxon, client: DbClient = db) =>
  DbUtils.runQueries(client, [
    () => updateTaxonProps({ surveyId, taxon }, client),
    ..._insertOrUpdateVernacularNames({
      surveyId,
      taxonUuid: Taxon.getUuid(taxon),
      vernacularNames: Taxon.getVernacularNames(taxon),
      client,
    }),
  ])

/**
 * Sets both the published and the draft props of a taxon, regardless of its publication status.
 * @param {object} params - The parameters.
 * @param {object} params.props - The published props.
 * @param {object} params.propsDraft - The draft props.
 * @returns {Promise<null>} The query result.
 */
export const updateTaxonPropsAndPropsDraft = (
  {
    surveyId,
    taxonUuid,
    props,
    propsDraft,
  }: { surveyId: number; taxonUuid: string; props: Record<string, any>; propsDraft: Record<string, any> },
  client: DbClient = db
) =>
  client.none(
    `UPDATE ${Schemata.getSchemaSurvey(surveyId)}.taxon
     SET props = $2, props_draft = $3
     WHERE uuid = $1`,
    [taxonUuid, props, propsDraft]
  )

export const updateTaxa = (surveyId: number, taxa: ArenaTaxon[], client: DbClient = db) =>
  DbUtils.runQueries(
    client,
    taxa.map((taxon) => () => updateTaxonAndVernacularNames(surveyId, taxon, client))
  )

export const updateTaxaProps = ({ surveyId, taxa }: { surveyId: number; taxa: ArenaTaxon[] }, client: DbClient = db) =>
  DbUtils.runQueries(
    client,
    taxa.map((taxon) => () => updateTaxonProps({ surveyId, taxon }, client))
  )

// Finds taxa whose "extra" prop data has a pending draft change (i.e. props_draft has an "extra" key
// whose value differs from the published one) - used to detect taxonomies whose extra prop values
// (not just their extraPropsDefs schema) changed, so that node defs reading them via taxonProp can be
// flagged for value recalculation on publish (see
// server/modules/survey/service/publish/nodeDefExtraPropDependencyUtils.js). Filtered at the DB level
// so surveys with no pending taxon extra-value edits (the common case) never pull taxon data into
// memory.
export const fetchTaxaWithChangedExtraValues = ({ surveyId }: { surveyId: number }, client: DbClient = db) =>
  client.any(
    `SELECT t.taxonomy_uuid AS "taxonomyUuid",
            t.props->'extra' AS "extraPublished",
            t.props_draft->'extra' AS "extraDraft"
     FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon t
     WHERE t.props_draft ? 'extra'
       AND (t.props_draft -> 'extra') IS DISTINCT FROM (t.props -> 'extra')`
  )

// ============== DELETE

export const deleteTaxonomy = (surveyId: number, taxonomyUuid: string, client: DbClient = db) =>
  deleteSurveySchemaTableRecord(surveyId, 'taxonomy', taxonomyUuid, client)

// only unpublished taxa are deleted
export const deleteDraftTaxaByUuids = (surveyId: number, taxonUuids: string[], client: DbClient = db) =>
  client.none(
    `DELETE FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon
     WHERE uuid IN ($1:csv)
       AND props::text = '{}'::text`,
    [taxonUuids]
  )

// only unpublished vernacular names are deleted
export const deleteDraftVernacularNamesByUuids = (
  surveyId: number,
  vernacularNameUuids: string[],
  client: DbClient = db
) =>
  client.none(
    `DELETE FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon_vernacular_name
     WHERE uuid IN ($1:csv)
       AND props::text = '{}'::text`,
    [vernacularNameUuids]
  )

export const deleteDraftTaxaByTaxonomyUuid = (surveyId: number, taxonomyUuid: string, client: DbClient = db) =>
  client.none(
    `DELETE FROM ${Schemata.getSchemaSurvey(surveyId)}.taxon
     WHERE taxonomy_uuid = $1
       AND props::text = '{}'::text`,
    [taxonomyUuid]
  )
