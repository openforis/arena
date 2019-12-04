import * as R from 'ramda'

import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'

const keys = {
  collectSurveyFileZip: 'collectSurveyFileZip',
  categories: 'categories',
  survey: 'survey',
  taxonomies: 'taxonomies',
}

// ===== READ

export const getCollectSurveyFileZip = R.prop(keys.collectSurveyFileZip)

export const getCategories = R.propOr([], keys.categories)

export const getCategoryByName = name =>
  R.pipe(
    getCategories,
    R.find(c => name === Category.getName(c)),
  )

export const getSurvey = R.prop(keys.survey)

export const getTaxonomies = R.propOr([], keys.taxonomies)

export const getTaxonomyByName = name =>
  R.pipe(
    getTaxonomies,
    R.find(t => name === Taxonomy.getName(t)),
  )

// ===== UPDATE

export const assocSurvey = R.assoc(keys.survey)

const assocCategories = R.assoc(keys.categories)

export const assocCategory = category => context =>
  R.pipe(getCategories, R.append(category), categories => assocCategories(categories)(context))(context)
