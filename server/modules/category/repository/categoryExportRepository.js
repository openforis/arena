import { Schemata } from '@openforis/arena-server'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import * as DbUtils from '@server/db/dbUtils'

export const cumulativeAreaField = 'area_cumulative'
export const codeJointField = 'code_joint'

const areaPropName = Category.reportingDataItemExtraDefKeys.area
const codeJointSeparator = '*'

const getQueryPrefix = ({ surveyId, draft = true }) => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  return `WITH RECURSIVE category_item_extended AS (
      SELECT *, 
        ${DbUtils.getPropColCombined(CategoryItem.keysProps.code, draft)} AS code,
        ARRAY[]::uuid[] as hierarchy, 
        ARRAY[${DbUtils.getPropColCombined(CategoryItem.keysProps.code, draft)}] AS level_codes,
        ARRAY[(${DbUtils.getPropColCombined(CategoryItem.keysProps.index, draft)})::int] AS index_path
      FROM ${schema}.category_item
      WHERE parent_uuid IS NULL
      UNION ALL
      SELECT i.*, 
        ${DbUtils.getPropColCombined(CategoryItem.keysProps.code, draft, 'i.')} AS code,
        array_append(a.hierarchy, i.parent_uuid),
        array_append(a.level_codes, ${DbUtils.getPropColCombined(CategoryItem.keysProps.code, draft, 'i.')}),
        array_append(a.index_path, (${DbUtils.getPropColCombined(CategoryItem.keysProps.index, draft, 'i.')})::int)
      FROM ${schema}.category_item i 
      JOIN category_item_extended a ON i.parent_uuid = a.uuid
    )
  `
}

// the name of the extra prop is passed as a query parameter (extraPropNameParam is its placeholder)
const getExtraPropColumn = ({ columnPrefix, extraPropNameParam, draft = true }) =>
  `(${DbUtils.getPropColCombined(CategoryItem.keysProps.extra, draft, columnPrefix, false)}) ->> ${extraPropNameParam}`

const getSelectCumulativeAreaSubquery = ({ params, draft = true }) => {
  const areaColumn = getExtraPropColumn({ columnPrefix: 'ext.', extraPropNameParam: params.add(areaPropName), draft })
  return `COALESCE((
    SELECT SUM (COALESCE((${areaColumn})::numeric, 0))
    FROM category_item_extended ext 
    WHERE ext.hierarchy @> ARRAY[i.uuid]
  ), 0) AS ${cumulativeAreaField}`
}

/**
 * Generates the query to export the category.
 * Level names, languages and extra prop names are passed as query parameters, column aliases included (quoted).
 * @param {!object} params - The parameters object.
 * @param {!number} [params.surveyId] - The id of the survey.
 * @param {!object} [params.category] - The category to export (with levels).
 * @param {string[]} [params.languages] - Array with the languages in the survey.
 * @param {boolean} [params.draft] - Whether to export draft props.
 * @param {boolean} [params.includeCumulativeArea] - Whether to include the area_cumulative field (sum of descendants area extra property value).
 * @returns {{query: string, values: Array<unknown>}} The query to be used to export the category and its parameters values.
 */
const generateCategoryExportQuery = ({
  surveyId,
  category,
  languages,
  draft = true,
  includeCumulativeArea = false,
}) => {
  const params = DbUtils.newQueryParams([Category.getUuid(category)])
  const levels = Category.getLevelsArray(category)
  const extraProps = Category.getItemExtraDefKeys(category)
  const queryPrefix = getQueryPrefix({ surveyId, draft })
  const asAlias = (alias) => `AS ${params.add(alias, ':name')}`
  const codesFields = levels.map(
    (level, index) => `COALESCE(level_codes[${index + 1}], '') ${asAlias(`${CategoryLevel.getName(level)}_code`)}`
  )
  const getLabelsOrDescriptionsFields = (propName, aliasPrefix) =>
    languages.map((lang) => {
      const column = `(${DbUtils.getPropColCombined(propName, draft, 'i.', false)}) ->> ${params.add(lang)}`
      return `${column} ${asAlias(`${aliasPrefix}_${lang}`)}`
    })
  const labelsFields = getLabelsOrDescriptionsFields(CategoryItem.keysProps.labels, 'label')
  const descriptionsFields = getLabelsOrDescriptionsFields(CategoryItem.keysProps.descriptions, 'description')
  const extraPropsFields = extraProps.map((extraPropName) => {
    const column = getExtraPropColumn({ columnPrefix: 'i.', extraPropNameParam: params.add(extraPropName), draft })
    return `${column} ${asAlias(extraPropName)}`
  })

  const selectFields = [
    'i.uuid',
    'code',
    'l.index as level_index',
    `ARRAY_TO_STRING(level_codes, '${codeJointSeparator}') AS ${codeJointField}`,
    ...codesFields,
    ...labelsFields,
    ...descriptionsFields,
    ...extraPropsFields,
    ...(includeCumulativeArea ? [getSelectCumulativeAreaSubquery({ params, draft })] : []),
  ].join(', ')

  const query = `${queryPrefix} 
    SELECT ${selectFields}
    FROM category_item_extended i
    JOIN ${Schemata.getSchemaSurvey(surveyId)}.category_level l ON l.uuid = i.level_uuid
    WHERE l.category_uuid = $1
    ORDER BY index_path, i.id`
  return { query, values: params.values }
}

export const generateCategoryExportStream = ({
  surveyId,
  category,
  languages = [],
  includeCumulativeArea = false,
  draft = true,
}) => {
  const { query, values } = generateCategoryExportQuery({
    surveyId,
    category,
    languages,
    includeCumulativeArea,
    draft,
  })
  const queryFormatted = DbUtils.formatQuery(query, values)
  return new DbUtils.QueryStream(queryFormatted)
}
