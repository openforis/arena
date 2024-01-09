import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import { CategoryExportFile } from '@core/survey/categoryExportFile'

import * as DbUtils from '@server/db/dbUtils'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import { Schemata } from '@openforis/arena-server'

const arenaPropName = 'area'
const cumulativeAreaField = 'area_cumulative'

const getEmpty = ({ header }) => `'' AS ${header}`

const getFieldIdAlias = ({ index }) => `level_${index}_id`

const getFieldLevelPosition = ({ levelIndex }) => `${levelIndex + 1} AS level_index`

const getFieldUuid = ({ levelIndex }) => `c${levelIndex}.uuid AS uuid`

const getFieldId = ({ index, isEmpty }) => `${isEmpty ? '-1' : `c${index}.id`} AS ${getFieldIdAlias({ index })}`

const getFieldCode = ({ index, header, isEmpty }) =>
  isEmpty ? getEmpty({ header }) : `(c${index}.props || c${index}.props_draft) ->> 'code' AS ${header}`

/**
 * Return the labels if needed by language.
 *
 * @param {!object} params - The parameters object.
 * @param {!string[]} [params.languages] - Array with the languages in the survey.
 * @param {!object[]} [params.levels] - The category levels.
 * @param {!number} [params.levelIndex] - Current level iteration index.
 * @param {!string} [params.prop] - Key of the prop being fetched from item props.
 * @param {!string} [params.aliasPrefix] - Prefix for the column alias.
 *
 * @returns {string} The labels to be returned.
 */
const getFieldsLabelsOrDescriptions = ({ languages, levels, levelIndex, prop, aliasPrefix }) =>
  (languages || []).map((language) => {
    return `COALESCE(${levels.map((l, lindex) => {
      const itemTableIdx = levels.length - lindex - 1
      return itemTableIdx > levelIndex
        ? 'NULL'
        : `(((c${itemTableIdx}.props || c${itemTableIdx}.props_draft) -> '${prop}') ->> '${language}')`
    })}, NULL) AS ${aliasPrefix}_${language}`
  })

const getExtraProps = ({ extraProps, levels, levelIndex }) =>
  extraProps.map((extraProp) => {
    return `COALESCE(${levels.map((l, lindex) => {
      const itemTableIdx = levels.length - lindex - 1
      return itemTableIdx > levelIndex
        ? 'NULL'
        : `(((c${itemTableIdx}.props || c${itemTableIdx}.props_draft) -> 'extra') ->> '${extraProp}')`
    })}, NULL) AS ${extraProp}`
  })

/**
 * Prepare the values that should be returned by the query.
 * The values for a level deeper than the levelIndex should be returned empty.
 *
 * @param {!object} params - The parameters object.
 * @param {!number} [params.levelIndex] - Current level iteration index.
 * @param {object[]} [params.levels] - The levels.
 * @param {string[]} [params.selectFields] - Array with the column names to select.
 * @param {string[]} [params.extraProps] - Array with the names of the extraProps.
 * @param {string[]} [params.languages] - Array with the languages in the survey.
 *
 * @returns {string} The select fields that will be added to the query.
 */
const getSelectFields = ({ levelIndex, levels, selectFields: selectFieldsParam, extraProps, languages }) =>
  levels
    .reduce((selectFields, _, index) => {
      const isEmpty = index > levelIndex
      return [
        ...selectFields,
        getFieldId({ index, isEmpty }),
        getFieldCode({ index, header: selectFieldsParam[index], isEmpty }),
      ]
    }, [])
    .concat([
      getFieldLevelPosition({ levelIndex }),
      getFieldUuid({ levelIndex }),
      ...getFieldsLabelsOrDescriptions({
        levels,
        languages,
        levelIndex,
        prop: CategoryItem.keysProps.labels,
        aliasPrefix: 'label',
      }),
      ...getFieldsLabelsOrDescriptions({
        levels,
        languages,
        levelIndex,
        prop: CategoryItem.keysProps.descriptions,
        aliasPrefix: 'description',
      }),
      ...(extraProps ? getExtraProps({ extraProps, levels, levelIndex }) : []),
    ])
    .join(', ')

/**
 * Prepare the joins to get the levels with the sublevels.
 *
 * @param {!object} params - The parameters object.
 * @param {!number} [params.levelIndex] - Current level index.
 * @param {!number} [params.surveyId] - The id of the survey.
 *
 * @returns {string} The joins to be added to the query.
 */
const getJoins = ({ levelIndex, surveyId }) => {
  let joins = ''
  for (let i = 0; i < levelIndex; i += 1) {
    joins += `
            LEFT JOIN ${getSurveyDBSchema(surveyId)}.category_item c${i + 1} 
            ON c${i + 1}.parent_uuid = c${i}.uuid
        `
  }
  return joins
}

const getSubqueryByLevel = ({
  surveyId,
  languages,
  levels,
  selectFields,
  extraProps,
  numColumnsPerLevel,
  levelIndex,
  includeCumulativeArea,
}) =>
  `(
    SELECT
      ${getSelectFields({
        levelIndex,
        levels,
        selectFields,
        extraProps,
        numColumnsPerLevel,
        languages,
        includeCumulativeArea,
      })}
    FROM
        ${getSurveyDBSchema(surveyId)}.category_item c0
            LEFT JOIN ${getSurveyDBSchema(surveyId)}.category_level l0
            ON c0.level_uuid = l0.uuid
        ${levelIndex > 0 ? getJoins({ levelIndex, surveyId }) : ''}
    WHERE c0.parent_uuid IS NULL
      AND l0.category_uuid = $1
      AND c${levelIndex}.uuid IS NOT NULL
  )`

const getQueryPrefix = ({ surveyId, includeCumulativeArea }) => {
  if (!includeCumulativeArea) return ''
  const schema = Schemata.getSchemaSurvey(surveyId)
  return `WITH RECURSIVE category_item_extended AS (
      SELECT *, ARRAY[]::uuid[] as hierarchy
      FROM ${schema}.category_item
      WHERE parent_uuid IS NULL
      UNION ALL
      SELECT i.*, array_append(a.hierarchy, i.parent_uuid)
      FROM ${schema}.category_item i 
      JOIN category_item_extended a ON i.parent_uuid = a.uuid
    )
  `
}

const getSelectCumulativeAreaSubquery = () => {
  return `(SELECT SUM (COALESCE((((ext.props || ext.props_draft)->'${CategoryItem.keysProps.extra}')->>'${arenaPropName}')::numeric, 0))
            FROM category_item_extended ext 
            WHERE ext.hierarchy @> ARRAY[sel.uuid]
    ) AS ${cumulativeAreaField}`
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
  selectFields,
  languages,
  includeCumulativeArea = false,
}) => {
  const levels = Category.getLevelsArray(category)
  const extraProps = Category.getItemExtraDefKeys(category)

  // code_column + # of languages
  const numColumnsPerLevel = 1 + languages.length

  // iterate over the levels to build the query
  return `${getQueryPrefix({ surveyId, includeCumulativeArea })} 
  SELECT uuid, ${selectFields}, ${includeCumulativeArea ? getSelectCumulativeAreaSubquery() : ''}
    FROM (${levels
      .map((_, levelIndex) =>
        getSubqueryByLevel({
          surveyId,
          languages,
          levels,
          selectFields,
          extraProps,
          numColumnsPerLevel,
          levelIndex,
          includeCumulativeArea,
        })
      )
      .join(' UNION ')}
    -- order by item id to preserve insertion order
    ORDER BY ${levels.map((_, index) => getFieldIdAlias({ index })).join(', ')}
  ) AS sel`
}

const _getSelectFieldsExcludingExtra = ({ category, languages = [] }) => {
  const levels = Category.getLevelsArray(category)
  const flat = levels.length === 1
  return levels
    .sort((la, lb) => la.index - lb.index)
    .reduce((headers, level) => [...headers, CategoryExportFile.getLevelCodeHeader({ level, flat })], [])
    .concat(languages.map((language) => CategoryExportFile.getLabelHeader({ language })))
    .concat(languages.map((language) => CategoryExportFile.getDescriptionHeader({ language })))
}

const _getSelectFields = ({ category, languages = [] }) =>
  _getSelectFieldsExcludingExtra({ category, languages }).concat(Category.getItemExtraDefKeys(category))

export const getCategoryExportHeaders = ({ category, languages = [], includeCumulativeArea = false }) =>
  _getSelectFieldsExcludingExtra({ category, languages }).concat(
    Category.getItemExtraDefsArray(category).flatMap((extraPropDef) =>
      CategoryExportFile.getExtraPropHeaders({ extraPropDef })
    ),
    ...(includeCumulativeArea ? [cumulativeAreaField] : [])
  )

export const generateCategoryExportStreamAndHeaders = ({
  surveyId,
  category,
  languages = [],
  includeReportingDataCumulativeArea = false,
}) => {
  const includeCumulativeArea = Category.isReportingData(category) && includeReportingDataCumulativeArea
  const headers = getCategoryExportHeaders({ category, languages, includeCumulativeArea })
  const selectFields = _getSelectFields({ category, languages })
  const query = generateCategoryExportQuery({
    surveyId,
    category,
    selectFields,
    languages,
    includeCumulativeArea,
  })
  const categoryUuid = Category.getUuid(category)
  const queryFormatted = DbUtils.formatQuery(query, [categoryUuid])
  return { stream: new DbUtils.QueryStream(queryFormatted), headers }
}
