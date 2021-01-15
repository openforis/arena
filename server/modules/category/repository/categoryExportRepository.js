import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Response from '@server/utils/response'
import * as CSVWriter from '@server/utils/file/csvWriter'

const getEmpty = ({ header }) => `'' AS ${header}`

const getFieldIdAlias = ({ index }) => `level_${index}_id`

const getFieldId = ({ index, isEmpty }) => `${isEmpty ? 'null' : `c${index}.id`} AS ${getFieldIdAlias({ index })}`

const getFieldCode = ({ index, header, isEmpty }) =>
  isEmpty ? getEmpty({ header }) : `(c${index}.props || c${index}.props_draft) ->> 'code' AS ${header}`

const getFieldLabel = ({ index, header, language, isEmpty }) =>
  isEmpty
    ? getEmpty({ header })
    : `((c${index}.props || c${index}.props_draft) -> 'labels') ->> '${language}' AS ${header}`

/**
 * Return the labels if needed by language.
 *
 * @param {!object} params - The parameters object.
 * @param {number} [params.index] - Current level iteration index.
 * @param {string[]} [params.languages] - Array with the languages in the survey.
 * @param {!number} [params.numColumnsPerLevel] - Number of columns per level.
 * @param {string[]} [params.headers] - Array with the names of the headers.
 * @param {!boolean} [params.isEmpty] - Check if the value returned should be empty.
 *
 * @returns {string} The labels to be returned.
 */
const getFieldsLabel = ({ index, languages, numColumnsPerLevel, headers, isEmpty }) =>
  (languages || []).map((language, languageIndex) =>
    getFieldLabel({
      index,
      header: headers[index * numColumnsPerLevel + 1 + languageIndex],
      language,
      isEmpty,
    })
  )

/**
 * Prepare the values that should be returned by the query.
 * The values for a level deeper than the levelIndex should be returned empty.
 *
 * @param {!object} params - The parameters object.
 * @param {!number} [params.levelIndex] - Current level iteration index.
 * @param {object[]} [params.levels] - The levels.
 * @param {string[]} [params.headers] - Array with the names of the headers.
 * @param {!number} [params.numColumnsPerLevel] - Number of columns per level.
 * @param {string[]} [params.languages] - Array with the languages in the survey.
 *
 * @returns {string} The select fields that will be added to the query.
 */
const getSelectFields = ({ levelIndex, levels, headers, numColumnsPerLevel, languages }) =>
  levels
    .reduce((selectFields, _, index) => {
      const isEmpty = index > levelIndex
      return [
        ...selectFields,
        getFieldId({ index, isEmpty }),
        getFieldCode({ index, header: headers[index * numColumnsPerLevel], isEmpty }),
        ...getFieldsLabel({ index, languages, numColumnsPerLevel, headers, isEmpty }),
      ]
    }, [])
    .join(', ')

/**
 * Prepare the joins to get the levels with the sublevels.
 *
 * @param {!object} params - The paramters object.
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

const getSubqueryByLevel = ({ surveyId, languages, levels, headers, numColumnsPerLevel, levelIndex }) =>
  `(
    SELECT
      ${getSelectFields({ levelIndex, levels, headers, numColumnsPerLevel, languages })}
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
export const generateCategoryExportQuery = ({ surveyId, levels, headers, languages }) => {
  // code_column + # of languages
  const numColumnsPerLevel = 1 + languages.length

  // iterate over the levels to build the query
  return `SELECT ${headers} FROM (
    ${levels
      .map((_, levelIndex) =>
        getSubqueryByLevel({ surveyId, languages, levels, headers, numColumnsPerLevel, levelIndex })
      )
      .join(' UNION ')}
    -- order by item id to preserve insertion order
    ORDER BY ${levels.map((_, index) => getFieldIdAlias({ index })).join(', ')} NULLS FIRST
  ) AS sel`
}

export const getCategoryExportHeaders = ({ levels, languages }) =>
  levels
    .sort((la, lb) => la.index - lb.index)
    .reduce(
      (headers, level) => [
        ...headers,
        `${CategoryLevel.getName(level)}_code`,
        ...(languages || []).map((language) => `${CategoryLevel.getName(level)}_label_${language}`),
      ],
      []
    )

export const getCategoryExportTemplate = async ({ res }) => {
  Response.setContentTypeFile(res, 'template_code_list_hierarchical.csv', null, Response.contentTypes.csv)
  await CSVWriter.writeToStream(res, [
    { level_1_code: 1, level_1_en: 'label_1', level_2_code: '', level_2_en: '' },
    { level_1_code: 1, level_1_en: 'label_1', level_2_code: 1, level_2_en: 'label_1_1' },
    { level_1_code: 1, level_1_en: 'label_1', level_2_code: 2, level_2_en: 'label_1_2' },
    { level_1_code: 2, level_1_en: 'label_2', level_2_code: '', level_2_en: '' },
  ])
}
