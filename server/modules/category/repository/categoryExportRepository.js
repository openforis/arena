import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Category from '@core/survey/category'
import * as CSVWriter from '@server/utils/file/csvWriter'
import * as DbUtils from '@server/db/dbUtils'

const getEmpty = ({ header }) => `'' AS ${header}`

const getFieldIdAlias = ({ index }) => `level_${index}_id`

const getFieldId = ({ index, isEmpty }) => `${isEmpty ? '-1' : `c${index}.id`} AS ${getFieldIdAlias({ index })}`

const getFieldCode = ({ index, header, isEmpty }) =>
  isEmpty ? getEmpty({ header }) : `(c${index}.props || c${index}.props_draft) ->> 'code' AS ${header}`

/**
 * Return the labels if needed by language.
 *
 * @param {!object} params - The parameters object.
 * @param {number} [params.index] - Current level iteration index.
 * @param {string[]} [params.languages] - Array with the languages in the survey.
 * @param {string[]} [params.headers] - Array with the names of the headers.
 * @param {!boolean} [params.isEmpty] - Check if the value returned should be empty.
 *
 * @returns {string} The labels to be returned.
 */
const getFieldsLabels = ({ languages, levels, levelIndex }) => {
  return (languages || []).map((language) => {
    return `COALESCE(${levels.map((l, lindex) =>
      levels.length - lindex - 1 > levelIndex
        ? 'NULL'
        : `(((c${levels.length - lindex - 1}.props || c${
            levels.length - lindex - 1
          }.props_draft) -> 'labels') ->> '${language}')`
    )}, NULL) AS label_${language}`
  })
}

const getExtraProps = ({ extraProps, levels, levelIndex }) => {
  return extraProps.map((extraProp) => {
    return `COALESCE(${levels.map((l, lindex) =>
      levels.length - lindex - 1 > levelIndex
        ? 'NULL'
        : `(((c${levels.length - lindex - 1}.props || c${
            levels.length - lindex - 1
          }.props_draft) -> 'extra') ->> '${extraProp}')`
    )}, NULL) AS ${extraProp}`
  })
}

/**
 * Prepare the values that should be returned by the query.
 * The values for a level deeper than the levelIndex should be returned empty.
 *
 * @param {!object} params - The parameters object.
 * @param {!number} [params.levelIndex] - Current level iteration index.
 * @param {object[]} [params.levels] - The levels.
 * @param {string[]} [params.headers] - Array with the names of the headers.
 * @param {string[]} [params.extraProps] - Array with the names of the extraProps.
 * @param {string[]} [params.languages] - Array with the languages in the survey.
 *
 * @returns {string} The select fields that will be added to the query.
 */
const getSelectFields = ({ levelIndex, levels, headers, extraProps, languages }) =>
  levels
    .reduce((selectFields, _, index) => {
      const isEmpty = index > levelIndex
      return [...selectFields, getFieldId({ index, isEmpty }), getFieldCode({ index, header: headers[index], isEmpty })]
    }, [])
    .concat([
      ...getFieldsLabels({ levels, languages, headers, levelIndex }),
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

const getSubqueryByLevel = ({ surveyId, languages, levels, headers, extraProps, numColumnsPerLevel, levelIndex }) =>
  `(
    SELECT
      ${getSelectFields({ levelIndex, levels, headers, extraProps, numColumnsPerLevel, languages })}
    FROM
        ${getSurveyDBSchema(surveyId)}.category_item c0
            LEFT JOIN ${getSurveyDBSchema(surveyId)}.category_level l0
            ON c0.level_uuid = l0.uuid
        ${levelIndex > 0 ? getJoins({ levelIndex, surveyId }) : ''}
    WHERE c0.parent_uuid IS NULL
      AND l0.category_uuid = $1
      AND c${levelIndex}.uuid IS NOT NULL
  )`

/**
 * Generates the query to export the category.
 *
 * @param {!object} params - The parameters object.
 * @param {!number} [params.surveyId] - The id of the survey.
 * @param {object[]} [params.levels] - Array of levels.
 * @param {string[]} [params.headers] - Array with the names of the headers.
 * @param {string[]} [params.languages] - Array with the languages in the survey.
 *
 * @returns {string} The query to be used to export the category.
 */
const generateCategoryExportQuery = ({ surveyId, category, headers, languages }) => {
  const levels = Category.getLevelsArray(category)
  const extraProps = Category.getItemExtraDefKeys(category)

  // code_column + # of languages
  const numColumnsPerLevel = 1 + languages.length

  // iterate over the levels to build the query
  return `SELECT ${headers} FROM (
    ${levels
      .map((_, levelIndex) =>
        getSubqueryByLevel({
          surveyId,
          languages,
          levels,
          headers,
          extraProps,
          numColumnsPerLevel,
          levelIndex,
        })
      )
      .join(' UNION ')}
    -- order by item id to preserve insertion order
    ORDER BY ${levels.map((_, index) => getFieldIdAlias({ index })).join(', ')}
  ) AS sel`
}

const _getLevelCodeHeader = ({ level }) => `${CategoryLevel.getName(level)}_code`
const _getLabelHeader = ({ language }) => `label_${language}`

export const getCategoryExportHeaders = ({ category, languages }) => {
  const levels = Category.getLevelsArray(category)
  return levels
    .sort((la, lb) => la.index - lb.index)
    .reduce((headers, level) => [...headers, _getLevelCodeHeader({ level })], [])
    .concat([...(languages || []).map((language) => _getLabelHeader({ language }))])
    .concat(Category.getItemExtraDefKeys(category))
}

export const writeCategoryExportTemplateToStream = async ({ outputStream, levels, languages }) => {
  const items = [
    { levelCodes: [1] },
    { levelCodes: [1, 1] },
    { levelCodes: [1, 2] },
    { levelCodes: [2] },
    { levelCodes: [2, 1] },
    { levelCodes: [2, 2] },
  ]
  const templateData = items.map((item) => ({
    // levelCodes
    ...levels.reduce(
      (acc, level, levelIndex) => ({
        ...acc,
        [_getLevelCodeHeader({ level })]: item.levelCodes[levelIndex] || '',
      }),
      {}
    ),
    // labels
    ...languages.reduce(
      (acc, language) => ({
        ...acc,
        [_getLabelHeader({ language })]: `Item ${item.levelCodes.join('-')} label (${language})`,
      }),
      {}
    ),
    // extra: TODO
  }))

  await CSVWriter.writeToStream(outputStream, templateData)
}

export const generateCategoryExportStreamAndHeaders = ({ surveyId, category, languages }) => {
  const headers = getCategoryExportHeaders({ category, languages })
  const query = generateCategoryExportQuery({ surveyId, category, headers, languages })
  const categoryUuid = Category.getUuid(category)
  const queryFormatted = DbUtils.formatQuery(query, [categoryUuid])
  return { stream: new DbUtils.QueryStream(queryFormatted), headers }
}
