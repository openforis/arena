/**
 * The assistant tools whose results carry survey structure only (data class `schema`). The gateway uses the list to
 * tell which tool results in a request may hold record data: every tool not listed counts as `data`. A unit test
 * keeps it equal to the schema tools of the browser (`webapp/ai/tools`).
 */
export const SCHEMA_TOOL_NAMES: readonly string[] = [
  'categories_list',
  'categoryItemLabels_proposeSet',
  'categoryItems_listMissingLabels',
  'category_findItems',
  'conversation_setTitle',
  'docs_search',
  'expression_check',
  'expressions_proposeSet',
  'labels_proposeSet',
  'nodeDef_get',
  'nodeDef_proposeCreate',
  'nodeDef_proposeUpdate',
  'nodeDef_search',
  'query_listEntities',
  'query_propose',
  'survey_getOverview',
  'survey_getValidation',
  'survey_listMissingTexts',
  'taxonomies_list',
  'view_getCurrent',
]

const schemaToolNames = new Set(SCHEMA_TOOL_NAMES)

/**
 * Returns true when the results of the tool carry no record data.
 * @param {unknown} toolName - Name of the tool.
 * @returns {boolean} True for a known schema tool; false for a data tool and for any name not in the list.
 */
export const isSchemaTool = (toolName: unknown): boolean =>
  typeof toolName === 'string' && schemaToolNames.has(toolName)
