const Job = require('../../../job/job')

const Survey = require('../../../../common/survey/survey')
const Category = require('../../../../common/survey/category')
const CategoryImportSummary = require('../../../../common/survey/categoryImportSummary')
const CategoryLevel = require('../../../../common/survey/categoryLevel')
const CategoryItem = require('../../../../common/survey/categoryItem')

const SurveyManager = require('../../survey/manager/surveyManager')
const CategoryManager = require('../manager/categoryManager')
const CategoryImportCSVParser = require('./categoryImportCSVParser')

class CategoryImportJob extends Job {

  constructor (params) {
    super(CategoryImportJob.type, params)

    this.itemsByAncestorCodes = [] // cache of category items by ancestor codes
  }

  async execute () {
    const { categoryUuid, summary } = this.params

    const surveyId = this.getSurveyId()
    const user = this.getUser()

    // insert levels
    this.logDebug('inserting levels')
    const levels = []

    await CategoryManager.deleteLevelsByCategory(user, surveyId, categoryUuid, this.tx)
    const category = await CategoryManager.fetchCategoryByUuid(surveyId, categoryUuid, true, false, this.tx)

    const levelNames = CategoryImportSummary.getLevelNames(summary)

    for (const levelName of levelNames) {
      const levelToInsert = Category.newLevel(category, {
        [CategoryLevel.props.name]: levelName
      })
      const level = await CategoryManager.insertLevel(user, surveyId, levelToInsert, this.tx)
      levels.push(level)
    }
    this.logDebug(`levels inserted: ${levelNames}`)

    // insert items
    const survey = await SurveyManager.fetchSurveyById(surveyId, true, false, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const languages = Survey.getLanguages(surveyInfo)

    const reader = await CategoryImportCSVParser.createRowsReader(summary, levels, languages,
      async itemRow => {
        if (this.isCanceled()) {
          reader.cancel()
          return
        }
        const { levelIndex, codes, labels, descriptions, extra } = itemRow

        const level = levels[levelIndex]

        let itemParentUuid = null
        if (levelIndex > 0) {
          const itemParent = this.itemsByAncestorCodes[codes.slice(0, codes.length - 1)]
          itemParentUuid = CategoryItem.getUuid(itemParent)
        }

        const itemToInsert = CategoryItem.newItem(CategoryLevel.getUuid(level), itemParentUuid, {
          [CategoryItem.props.code]: codes[codes.length - 1],
          [CategoryItem.props.labels]: labels,
          [CategoryItem.props.descriptions]: descriptions,
          [CategoryItem.props.extra]: extra,

        })

        const item = await CategoryManager.insertItem(user, surveyId, itemToInsert, this.tx)

        this.itemsByAncestorCodes[codes] = item
        this.incrementProcessedItems()
      },
      total => this.total = total
    )

    await reader.start()
  }
}

CategoryImportJob.type = 'CategoryImportJob'

module.exports = CategoryImportJob

