const R = require('ramda')

const Category = require('../../../../../common/survey/category')
const Taxonomy = require('../../../../../common/survey/taxonomy')

const keys = {
  collectSurveyFileZip: 'collectSurveyFileZip',
  categories: 'categories',
  taxonomies: 'taxonomies',
}

// ===== READ

const getCollectSurveyFileZip = R.prop(keys.collectSurveyFileZip)

const getCategories = R.propOr([], keys.categories)

const getCategoryByName = name => R.pipe(
  getCategories,
  R.find(c => name === Category.getName(c))
)

const getTaxonomies = R.propOr([], keys.taxonomies)

const getTaxonomyByName = name => R.pipe(
  getTaxonomies,
  R.find(t => name === Taxonomy.getName(t))
)

// ===== UPDATE

const assocCategories = R.assoc(keys.categories)

const assocCategory = category => context => R.pipe(
  getCategories,
  R.append(category),
  categories => assocCategories(categories)(context)
)(context)

module.exports = {
  getCollectSurveyFileZip,
  getCategories,
  getCategoryByName,
  getTaxonomies,
  getTaxonomyByName,
  assocCategory,
}