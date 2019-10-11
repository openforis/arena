const R = require('ramda')

const Category = require('../../../../../core/survey/category')
const Taxonomy = require('../../../../../core/survey/taxonomy')

const keys = {
  collectSurveyFileZip: 'collectSurveyFileZip',
  categories: 'categories',
  survey: 'survey',
  taxonomies: 'taxonomies',
}

// ===== READ

const getCollectSurveyFileZip = R.prop(keys.collectSurveyFileZip)

const getCategories = R.propOr([], keys.categories)

const getCategoryByName = name => R.pipe(
  getCategories,
  R.find(c => name === Category.getName(c))
)

const getSurvey = R.prop(keys.survey)

const getTaxonomies = R.propOr([], keys.taxonomies)

const getTaxonomyByName = name => R.pipe(
  getTaxonomies,
  R.find(t => name === Taxonomy.getName(t))
)

// ===== UPDATE

const assocSurvey = R.assoc(keys.survey)

const assocCategories = R.assoc(keys.categories)

const assocCategory = category => context => R.pipe(
  getCategories,
  R.append(category),
  categories => assocCategories(categories)(context)
)(context)

module.exports = {
  //READ
  getCollectSurveyFileZip,
  getCategories,
  getCategoryByName,
  getSurvey,
  getTaxonomies,
  getTaxonomyByName,

  //UPDATE
  assocSurvey,
  assocCategory,
}