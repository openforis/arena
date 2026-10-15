/**
 * SQL of the category item labels endpoints (assistant suggestion 6). Labels are read from the combined draft props
 * (props || props_draft, merged at the top level).
 */
import SystemError, { StatusCodes } from '@core/systemError'
import type { MissingLabelsCounts, MissingLabelsItem } from '@common/ai/categoryItemLabels'
import { db } from '@server/db/db'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// the missing labels queries read every item of the categories: a huge category must not hold a connection for long
const queryTimeoutMs = 15_000
// Postgres error code for "query_canceled" (raised when statement_timeout expires)
const pgErrorCodeQueryCanceled = '57014'

// a label is blank when absent, empty or only white space
const BLANK = `'^[[:space:]]*$'`

/**
 * Returns the SQL of the combined draft props of a table alias.
 * @param {string} alias - Table alias.
 * @returns {string} The SQL expression.
 */
const combinedProps = (alias: string): string =>
  `(COALESCE(${alias}.props, '{}'::jsonb) || COALESCE(${alias}.props_draft, '{}'::jsonb))`

/**
 * Returns the SQL of the combined labels of a table alias (an empty object when they are not an object).
 * @param {string} alias - Table alias.
 * @returns {string} The SQL expression.
 */
const combinedLabels = (alias: string): string =>
  `(CASE WHEN jsonb_typeof(${combinedProps(alias)} -> 'labels') = 'object' ` +
  `THEN ${combinedProps(alias)} -> 'labels' ELSE '{}'::jsonb END)`

/**
 * Returns the SQL that tests a text for blankness.
 * @param {string} text - SQL text expression.
 * @returns {string} The SQL condition.
 */
const isBlank = (text: string): string => `(COALESCE(${text}, '') ~ ${BLANK})`

/**
 * Returns the SQL of the missing rule: blank in the language, filled in another survey language ($/langs/).
 * @param {string} labels - SQL labels expression (jsonb).
 * @param {string} lang - SQL language expression.
 * @returns {string} The SQL condition.
 */
const missingLabelCondition = (labels: string, lang: string): string =>
  `(${isBlank(`${labels} ->> ${lang}`)} AND EXISTS (SELECT 1 FROM unnest($/langs/::text[]) AS other(lang) ` +
  `WHERE other.lang <> ${lang} AND NOT ${isBlank(`${labels} ->> other.lang`)}))`

/**
 * Returns the SQL of the code of an item alias.
 * @param {string} alias - Item table alias.
 * @returns {string} The SQL expression.
 */
const itemCode = (alias: string): string => `COALESCE(${combinedProps(alias)} ->> 'code', '')`

/**
 * Runs a read query in a transaction that cancels it after the timeout.
 * @param {object} client - Database client.
 * @param {Function} query - The query, given the transaction.
 * @returns {Promise<T>} The result of the query.
 * @throws {SystemError} categoryItemLabelsTooLarge (503) when the query was cancelled by the timeout.
 */
const runBounded = async <T>(client: any, query: (t: any) => Promise<T>): Promise<T> => {
  try {
    return await client.tx(async (t: any) => {
      await t.none('SET LOCAL statement_timeout = $1', [`${queryTimeoutMs}ms`])
      return query(t)
    })
  } catch (error) {
    if ((error as { code?: string })?.code === pgErrorCodeQueryCanceled) {
      throw new SystemError('appErrors:categoryItemLabelsTooLarge', {}, StatusCodes.SERVICE_UNAVAILABLE)
    }
    throw error
  }
}

/**
 * Counts the items missing a label, per category and language.
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {string[]} params.langs - Survey languages.
 * @param {object} [client] - Database client.
 * @returns {Promise<MissingLabelsCounts>} Counts by category uuid, then language (only counts above 0).
 */
export const countItemsMissingLabels = async (
  { surveyId, langs }: { surveyId: number | string; langs: string[] },
  client: any = db
): Promise<MissingLabelsCounts> => {
  const schema = getSurveyDBSchema(surveyId)
  const rows: { categoryUuid: string; lang: string; count: number }[] = await runBounded(client, (t) =>
    t.any(
      `WITH items AS (
       SELECT l.category_uuid, ${combinedLabels('i')} AS labels
       FROM ${schema}.category_item i
       JOIN ${schema}.category_level l ON l.uuid = i.level_uuid
     )
     SELECT items.category_uuid AS "categoryUuid", langs.lang, COUNT(*)::int AS count
     FROM items CROSS JOIN unnest($/langs/::text[]) AS langs(lang)
     WHERE ${missingLabelCondition('items.labels', 'langs.lang')}
     GROUP BY items.category_uuid, langs.lang`,
      { langs }
    )
  )
  const counts: MissingLabelsCounts = {}
  for (const { categoryUuid, lang, count } of rows) {
    counts[categoryUuid] = { ...counts[categoryUuid], [lang]: count }
  }
  return counts
}

/**
 * Tells whether a category exists in the survey.
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {string} params.categoryUuid - Category uuid.
 * @param {object} [client] - Database client.
 * @returns {Promise<boolean>} True when it exists.
 */
export const categoryExists = async (
  { surveyId, categoryUuid }: { surveyId: number | string; categoryUuid: string },
  client: any = db
): Promise<boolean> =>
  client.one(
    `SELECT EXISTS (SELECT 1 FROM ${getSurveyDBSchema(surveyId)}.category WHERE uuid = $/categoryUuid/) AS found`,
    { categoryUuid },
    (row: { found: boolean }) => row.found
  )

type MissingLabelsRow = {
  uuid: string
  level_index: number
  level_name: string | null
  code_path: string[]
  labels: Record<string, string>
}

/**
 * Fetches the items of a category missing a label, in level, then code path order, after the cursor item. The cursor
 * is searched among all items (a filled one keeps its place); an unknown cursor restarts from the first item.
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {string} params.categoryUuid - Category uuid.
 * @param {string} params.lang - Missing language.
 * @param {string[]} params.langs - Survey languages.
 * @param {string|null} params.cursor - Uuid of the last item already listed.
 * @param {number} params.limit - Most items returned.
 * @param {object} [client] - Database client.
 * @returns {Promise<{total: number, items: MissingLabelsItem[]}>} The total of missing items and the items.
 */
export const fetchItemsMissingLabels = async (
  {
    surveyId,
    categoryUuid,
    lang,
    langs,
    cursor,
    limit,
  }: {
    surveyId: number | string
    categoryUuid: string
    lang: string
    langs: string[]
    cursor: string | null
    limit: number
  },
  client: any = db
): Promise<{ total: number; items: MissingLabelsItem[] }> => {
  const schema = getSurveyDBSchema(surveyId)
  // the code path is built (upwards) only for the missing items and the cursor item, not for the whole category
  const row: { total: number; items: MissingLabelsRow[] } = await runBounded(client, (t) =>
    t.one(
      `WITH RECURSIVE candidates AS (
         SELECT i.uuid, i.parent_uuid, i.level_uuid, ${itemCode('i')} AS code, ${combinedLabels('i')} AS labels
         FROM ${schema}.category_item i
         JOIN ${schema}.category_level l ON l.uuid = i.level_uuid
         WHERE l.category_uuid = $/categoryUuid/
       ),
       wanted AS (
         SELECT candidates.*, ${missingLabelCondition('candidates.labels', '$/lang/')} AS is_missing
         FROM candidates
       ),
       chain AS (
         SELECT w.uuid, w.parent_uuid AS next_uuid, ARRAY[w.code]::text[] AS code_path
         FROM wanted w
         WHERE w.is_missing OR w.uuid = $/cursor/::uuid
         UNION ALL
         SELECT chain.uuid, p.parent_uuid, ARRAY[${itemCode('p')}]::text[] || chain.code_path
         FROM chain
         JOIN ${schema}.category_item p ON p.uuid = chain.next_uuid
       ),
       labelled AS (
         SELECT w.uuid, chain.code_path, l.index AS level_index, ${combinedProps('l')} ->> 'name' AS level_name,
           w.labels, w.is_missing
         FROM chain
         JOIN wanted w ON w.uuid = chain.uuid
         JOIN ${schema}.category_level l ON l.uuid = w.level_uuid
         WHERE chain.next_uuid IS NULL
       ),
       missing AS (
         SELECT * FROM labelled WHERE is_missing
       ),
       start AS (
         SELECT level_index, code_path, uuid FROM labelled WHERE uuid = $/cursor/::uuid
       ),
       remaining AS (
         SELECT * FROM missing
         WHERE NOT EXISTS (SELECT 1 FROM start)
           OR (missing.level_index, missing.code_path, missing.uuid) > (SELECT level_index, code_path, uuid FROM start)
       )
       SELECT
         (SELECT COUNT(*)::int FROM missing) AS total,
         COALESCE(
           (SELECT json_agg(page ORDER BY page.level_index, page.code_path, page.uuid)
            FROM (SELECT * FROM remaining ORDER BY level_index, code_path, uuid LIMIT $/limit/) AS page),
           '[]'::json
         ) AS items`,
      { categoryUuid, lang, langs, cursor, limit }
    )
  )
  return {
    total: row.total,
    items: row.items.map((item) => ({
      uuid: item.uuid,
      levelIndex: item.level_index,
      levelName: item.level_name ?? '',
      codePath: item.code_path,
      labels: item.labels,
    })),
  }
}

export type ItemLabelsRow = {
  uuid: string
  categoryUuid: string
  levelUuid: string
  code: string
  labels: Record<string, string>
}

/**
 * Fetches the combined labels of items and locks their rows until the end of the transaction.
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {string[]} params.itemUuids - Item uuids.
 * @param {object} client - Database client (a transaction).
 * @returns {Promise<ItemLabelsRow[]>} The rows of the existing items.
 */
export const fetchItemsLabelsByUuids = async (
  { surveyId, itemUuids }: { surveyId: number | string; itemUuids: string[] },
  client: any
): Promise<ItemLabelsRow[]> => {
  const schema = getSurveyDBSchema(surveyId)
  return client.any(
    `SELECT i.uuid, l.category_uuid AS "categoryUuid", i.level_uuid AS "levelUuid", ${itemCode('i')} AS code,
       ${combinedLabels('i')} AS labels
     FROM ${schema}.category_item i
     JOIN ${schema}.category_level l ON l.uuid = i.level_uuid
     WHERE i.uuid = ANY($/itemUuids/::uuid[])
     ORDER BY i.uuid
     FOR UPDATE OF i`,
    { itemUuids }
  )
}

/**
 * Writes the label of an item in one language, in the draft props (the other languages are kept).
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {string} params.itemUuid - Item uuid.
 * @param {string} params.lang - Language.
 * @param {string} params.text - Label.
 * @param {object} client - Database client (a transaction).
 * @returns {Promise<Record<string, string>>} The combined labels after the write.
 */
export const updateItemLabel = async (
  { surveyId, itemUuid, lang, text }: { surveyId: number | string; itemUuid: string; lang: string; text: string },
  client: any
): Promise<Record<string, string>> =>
  client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.category_item AS i
     SET props_draft = COALESCE(i.props_draft, '{}'::jsonb)
       || jsonb_build_object('labels', ${combinedLabels('i')} || jsonb_build_object($/lang/::text, $/text/::text))
     WHERE i.uuid = $/itemUuid/
     RETURNING ${combinedLabels('i')} AS labels`,
    { itemUuid, lang, text },
    (row: { labels: Record<string, string> }) => row.labels
  )
