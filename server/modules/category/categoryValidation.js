import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Validation from '@core/validation/validation'

const keys = {
  children: 'children',
  items: 'items',
  levels: 'levels',
}

const deleteEmptyLevelError =
  ({ levelUuid }) =>
  (category) => {
    const validation = Category.getValidation(category)
    const level = Category.getLevelByUuid(levelUuid)(category)
    const levelIndex = CategoryLevel.getIndex(level)
    const levelsValidation = Validation.getFieldValidation(keys.levels)(validation)
    const levelValidation = Validation.getFieldValidation(levelIndex)(levelsValidation)
    const levelValidationUpdated = Validation.dissocFieldValidation(keys.items)(levelValidation)
    let levelsValidationUpdated = Validation.assocFieldValidation(levelIndex, levelValidationUpdated)(levelsValidation)
    if (Object.values(Validation.getFieldValidations(levelsValidation)).every(Validation.isValid)) {
      levelsValidationUpdated = Validation.setErrors([])(levelsValidationUpdated)
    }
    const validationUpdated = Validation.cleanup(
      Validation.assocFieldValidation(keys.levels, levelsValidationUpdated)(validation)
    )
    return {
      validation: validationUpdated,
      category,
    }
  }

export const CategoryValidation = {
  deleteEmptyLevelError,
}
