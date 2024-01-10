import { Schemata } from '@openforis/arena-server'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import * as DbUtils from '@server/db/dbUtils'

const areaPropName = Category.reportingDataItemExtraDefKeys.area
export const cumulativeAreaField = 'area_cumulative'
export const codeJointField = 'code_joint'
const codeJointSeparator = '*'

const getQueryPrefix = ({ surveyId, draft = true }) => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  return `WITH RECURSIVE category_item_extended AS (
      SELECT *, 
        ${DbUtils.getPropColCombined(CategoryItem.keysProps.code, draft)} AS code,
        ARRAY[]::uuid[] as hierarchy, 
        ARRAY[${DbUtils.getPropColCombined(CategoryItem.keysProps.code, draft)}] AS level_codes
      FROM ${schema}.category_item
      WHERE parent_uuid IS NULL
      UNION ALL
      SELECT i.*, 
        ${DbUtils.getPropColCombined(CategoryItem.keysProps.code, draft, 'i.')} AS code,
        array_append(a.hierarchy, i.parent_uuid),
        array_append(a.level_codes, ${DbUtils.getPropColCombined(CategoryItem.keysProps.code, draft, 'i.')})
      FROM ${schema}.category_item i 
      JOIN category_item_extended a ON i.parent_uuid = a.uuid
    )
  `
}

const getExtraPropColumn = ({ columnPrefix, extraPropName, draft = true }) =>
  `(${DbUtils.getPropColCombined(CategoryItem.keysProps.extra, draft, columnPrefix, false)}) ->> '${extraPropName}'`

const getSelectCumulativeAreaSubquery = ({ draft = true }) => {
  const areaColumn = getExtraPropColumn({ columnPrefix: 'ext.', extraPropName: areaPropName, draft })
  return `COALESCE((
    SELECT SUM (COALESCE((${areaColumn})::numeric, 0))
    FROM category_item_extended ext 
    WHERE ext.hierarchy @> ARRAY[i.uuid]
  ), 0) AS ${cumulativeAreaField}`
}

/**
 * Generates the query to export the category.
 *
 * @param {!object} params - The parameters object.
 * @param {!number} [params.surveyId] - The id of the survey.
 * @param {object[]} [params.levels] - Array of levels.
 * @param {string[]} [params.selectFields] - Array with the column names to select.
 * @param {string[]} [params.languages] - Array with the languages in the survey.
 * @param {boolean} [params.includeCumulativeArea=false] - Whether to include the area_cumulative field (sum of descendants area extra property value).
 *
 * @returns {string} The query to be used to export the category.
 */
const generateCategoryExportQuery = ({
  surveyId,
  category,
  languages,
  draft = true,
  includeCumulativeArea = false,
}) => {
  const levels = Category.getLevelsArray(category)
  const extraProps = Category.getItemExtraDefKeys(category)
  const queryPrefix = getQueryPrefix({ surveyId })
  const codesFields = levels.map(
    (level, index) => `COALESCE(level_codes[${index + 1}], '') AS ${CategoryLevel.getName(level)}_code`
  )
  const getLabelsOrDescriptionsFields = (propName, aliasPrefix) =>
    languages.map(
      (lang) => `(${DbUtils.getPropColCombined(propName, draft, 'i.', false)}) ->> '${lang}' AS ${aliasPrefix}_${lang}`
    )
  const labelsFields = getLabelsOrDescriptionsFields(CategoryItem.keysProps.labels, 'label')
  const descriptionsFields = getLabelsOrDescriptionsFields(CategoryItem.keysProps.descriptions, 'description')
  const extraPropsFields = extraProps.map(
    (extraPropName) => `${getExtraPropColumn({ columnPrefix: 'i.', extraPropName, draft })} AS ${extraPropName}`
  )

  const selectFields = [
    'code',
    'l.index as level_index',
    `ARRAY_TO_STRING(level_codes, '${codeJointSeparator}') AS ${codeJointField}`,
    ...codesFields,
    ...labelsFields,
    ...descriptionsFields,
    ...extraPropsFields,
    ...(includeCumulativeArea ? [getSelectCumulativeAreaSubquery({ draft })] : []),
  ].join(', ')

  return `${queryPrefix} 
    SELECT ${selectFields}
    FROM category_item_extended i
    JOIN ${Schemata.getSchemaSurvey(surveyId)}.category_level l ON l.uuid = i.level_uuid
    WHERE l.category_uuid = $1
    ORDER BY i.id`
}

export const generateCategoryExportStream = ({ surveyId, category, languages = [], includeCumulativeArea = false }) => {
  const query = generateCategoryExportQuery({
    surveyId,
    category,
    languages,
    includeCumulativeArea,
  })
  const categoryUuid = Category.getUuid(category)
  const queryFormatted = DbUtils.formatQuery(query, [categoryUuid])
  return new DbUtils.QueryStream(queryFormatted)
}
