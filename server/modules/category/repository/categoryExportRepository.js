import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as CategoryLevel from '@core/survey/categoryLevel'

const getEmpty = ({ header }) => `'' as ${header}`

const getCode = ({ index, header, isEmpty }) =>
  isEmpty ? getEmpty({ header }) : `(c${index}.props || c${index}.props_draft) ->> 'code' as ${header}`

const getLabel = ({ index, header, language, isEmpty }) =>
  isEmpty
    ? getEmpty({ header })
    : `((c${index}.props || c${index}.props_draft) -> 'labels') ->> '${language}' as ${header}`

/**
 * Return the labels if needed by language.
 *
 * @param {number} index - Level to return index.
 * @param {string[]} languages - Array with the languages in the survey.
 * @param {!number} numColumnsPerLevel - Number of columns per level.
 * @param {string[]} headers - Array with the names of the headers.
 * @param {!boolean} isEmpty - Check if the value returned should be empty.
 *
 * @returns {string} The labels to be returned.
 */
const getLabels = ({ index, languages, numColumnsPerLevel, headers, isEmpty }) =>
  (languages || []).map((language, languageIndex) =>
    getLabel({
      index,
      header: headers[index * numColumnsPerLevel + 1 + languageIndex],
      language,
      isEmpty,
    })
  )

/**
 * Prepare the values that should be returned by the query.
 * The values for a level deeper than the currentLevelIndex should be returned empty.
 *
 * @param {!number} currentLevelIndex - Current level iteration index.
 * @param {object[]} levels - The levels.
 * @param {string[]} headers - Array with the names of the headers.
 * @param {!number} numColumnsPerLevel - Number of columns per level.
 * @param {string[]} languages - Array with the languages in the survey.
 *
 * @returns {string} The values that the query returns to be added to the query.
 */
const getColumnValues = ({ currentLevelIndex, levels, headers, numColumnsPerLevel, languages }) =>
  levels
    .reduce(
      (values, level, i) => [
        ...values,
        getCode({ index: i, header: headers[i * numColumnsPerLevel], isEmpty: i > currentLevelIndex }),
        ...getLabels({ index: i, languages, numColumnsPerLevel, headers, isEmpty: i > currentLevelIndex }),
      ],
      []
    )
    .join(',')

/**
 * Prepare the joins to get the levels with the sublevels.
 *
 * @param {!number} index - Current iteration index.
 * @param {!number} surveyId - The id of the survey.
 *
 * @returns {string} The joins to be added to the query.
 */
const getJoins = ({ index, surveyId }) => {
  let joins = ''
  for (let i = 0; i < index; i++) {
    joins += `
            left join ${getSurveyDBSchema(surveyId)}.category_item c${i + 1} 
            on c${i + 1}.parent_uuid = c${i}.uuid
        `
  }
  return joins
}

/**
 * Generates the query to export the category.
 *
 * @param {!number} surveyId - The id of the survey.
 * @param {object[]} levels - Array of levels.
 * @param {string[]} headers - Array with the names of the headers.
 * @param {string[]} languages - Array with the languages in the survey.
 *
 * @returns {string} the query to be used to export the category.
 */
export const generateCategoryExportQuery = ({ surveyId, levels, headers, languages }) => {
  let query = ''

  // code_column + # of languages
  const numColumnsPerLevel = 1 + languages.length

  // loop to build the query
  levels.forEach((level, index) => {
    if (index > 0) query += 'union '

    query += `
        select
          ${getColumnValues({ currentLevelIndex: index, levels, headers, numColumnsPerLevel, languages })}
        from
            ${getSurveyDBSchema(surveyId)}.category_item c0
                
                left join ${getSurveyDBSchema(surveyId)}.category_level l0
                on c0.level_uuid = l0.uuid
            ${index > 0 ? getJoins({ index, surveyId }) : ''}
        
        where c0.parent_uuid is null
        and l0.category_uuid = $1
        and c${index}.uuid is not null
    `
  })

  query += `order by ${levels
    .map((level) => CategoryLevel.getIndex(level) * numColumnsPerLevel + 1)
    .join(',')} nulls first`

  return query
}
