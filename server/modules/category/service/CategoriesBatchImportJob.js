import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import Job from '@server/job/job'
import FileZip from '@server/utils/file/fileZip'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import CategoryBatchImportJob from './CategoryBatchImportJob'
import * as CategoryImportJobParams from './categoryImportJobParams'

const extractCategoryNameFromZipEntryName = (entryName) => {
  const lastIndexOfDirSeparator = entryName.lastIndexOf('/')
  const fileName = lastIndexOfDirSeparator > 0 ? entryName.substring(lastIndexOfDirSeparator + 1) : entryName
  return FileUtils.getBaseName(fileName)
}

export default class CategoriesBatchImportJob extends Job {
  constructor(params) {
    super(CategoriesBatchImportJob.type, params)
    this.insertedCategories = 0
    this.updatedCategories = 0
  }

  async onStart() {
    await super.onStart()

    const { context, user } = this
    const { filePath, surveyId } = context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true })
    this.setContext({ survey })

    const fileZip = new FileZip(filePath)
    await fileZip.init()
    this.setContext({ fileZip })

    if (!(await this.validateZipFile())) {
      return
    }

    const entryNames = fileZip.getEntryNames()
    const categoryNames = entryNames.map(extractCategoryNameFromZipEntryName)

    this.total = categoryNames.length

    const innerJobs = entryNames.map((entryName) => {
      const categoryName = extractCategoryNameFromZipEntryName(entryName)
      const existingCategory = Survey.getCategoryByName(categoryName)(survey)
      const existingCategoryUuid = existingCategory ? Category.getUuid(existingCategory) : null
      if (existingCategory) {
        this.updatedCategories += 1
      } else {
        this.insertedCategories += 1
      }
      return new CategoryBatchImportJob({
        user,
        fileZipEntryName: entryName,
        [CategoryImportJobParams.keys.categoryName]: categoryName,
        [CategoryImportJobParams.keys.categoryUuid]: existingCategoryUuid,
      })
    })
    this.innerJobs = innerJobs
  }

  async validateZipFile() {
    const { fileZip } = this.context
    const fileEntryNames = fileZip.getEntryNames()

    let errorKey = null

    if (fileEntryNames.length === 0) {
      errorKey = 'validationErrors.categoryImport.emptyFile'
    } else if (fileZip.getEntryNames({ excludeDirectories: false }).length > fileEntryNames.length) {
      // invalid zip file: it contains at least one directory
      errorKey = 'validationErrors.categoryImport.invalidImportFile'
    }
    if (errorKey) {
      this.addError({
        error: Validation.newInstance(false, {}, [{ key: errorKey }]),
      })
      await this.setStatusFailed()
      return false
    }
    const categoryNames = fileEntryNames.map(extractCategoryNameFromZipEntryName)
    if (!(await this.validateCategoryNames(categoryNames))) {
      return false
    }
    return true
  }

  async validateCategoryNames(categoryNames) {
    const categoryNameValidationErrors = await Promise.all(
      categoryNames.map((categoryName) =>
        Validator.validateName(Validation.messageKeys.nameInvalid, { name: categoryName })('name', {
          name: categoryName,
        })
      )
    )
    const firstValidationError = categoryNameValidationErrors.find((validationError) => !!validationError)
    if (firstValidationError) {
      this.addError({ error: Validation.newInstance(false, {}, [firstValidationError]) })
      await this.setStatusFailed()
      return false
    }
    return true
  }

  generateResult() {
    const { insertedCategories, updatedCategories, total } = this
    return {
      ...super.generateResult(),
      importedCategories: total,
      insertedCategories,
      updatedCategories,
    }
  }
}

CategoriesBatchImportJob.type = 'CategoriesBatchImportJob'
