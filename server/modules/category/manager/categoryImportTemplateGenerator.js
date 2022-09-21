import { PointFactory, Points } from '@openforis/arena-core'

import { ArrayUtils } from '@core/arrayUtils'

import * as Category from '@core/survey/category'
import { CategoryExportFile } from '@core/survey/categoryExportFile'
import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'

const generateDescendantItems = ({ levels, levelIndex = 0, previousLevelCodes = [], numItemsPerLevel = 2 }) => {
  const codes = ArrayUtils.fromNumberOfElements(numItemsPerLevel).map((codeIndex) => `${codeIndex + 1}`)

  return codes.reduce((acc, code) => {
    const levelCodes = [...previousLevelCodes, code]
    const item = { levelCodes }
    acc.push(item)

    if (levelIndex < levels.length - 1) {
      acc.push(
        ...generateDescendantItems({
          levels,
          levelIndex: levelIndex + 1,
          previousLevelCodes: levelCodes,
          numItemsPerLevel,
        })
      )
    }
    return acc
  }, [])
}

const generateItems = ({ levels, numItemsPerLevel = 2 }) => generateDescendantItems({ levels, numItemsPerLevel })

const generateCategoryTemplate = () => {
  let category = Category.newCategory({ [Category.keysProps.name]: 'template' })
  // levels (1st level already created when creating the category)
  category = Category.assocLevel({ level: Category.newLevel(category) })(category)
  category = Category.assocLevel({ level: Category.newLevel(category) })(category)
  // extra props
  category = Category.assocItemExtraDef({
    ['extra_prop_text']: CategoryItemExtraDef.newItem({ dataType: CategoryItemExtraDef.dataTypes.text }),
    ['extra_prop_number']: CategoryItemExtraDef.newItem({ dataType: CategoryItemExtraDef.dataTypes.number }),
    ['extra_prop_geometry']: CategoryItemExtraDef.newItem({ dataType: CategoryItemExtraDef.dataTypes.geometryPoint }),
  })(category)
  return category
}

const generateTemplate = ({ category: categoryProp = null, languages }) => {
  const category = categoryProp === null ? generateCategoryTemplate() : categoryProp
  const levels = Category.getLevelsArray(category)
  const extraDefs = Category.getItemExtraDefsArray(category)

  const items = generateItems({ levels })

  return items.map((item) => ({
    // levelCodes
    ...levels.reduce(
      (acc, level, levelIndex) => ({
        ...acc,
        [CategoryExportFile.getLevelCodeHeader({ level })]: item.levelCodes[levelIndex] || '',
      }),
      {}
    ),
    // labels
    ...languages.reduce(
      (acc, language) => ({
        ...acc,
        [CategoryExportFile.getLabelHeader({ language })]: `Item ${item.levelCodes.join('-')} label (${language})`,
      }),
      {}
    ),
    // labels
    ...languages.reduce(
      (acc, language) => ({
        ...acc,
        [CategoryExportFile.getDescriptionHeader({ language })]: `Item ${item.levelCodes.join(
          '-'
        )} description (${language})`,
      }),
      {}
    ),
    // extra
    ...extraDefs.reduce(
      (acc, extraDef) => ({
        ...acc,
        [extraDef.name]: templateExtraValueByType[CategoryItemExtraDef.getDataType(extraDef)],
      }),
      {}
    ),
  }))
}

const templateExtraValueByType = {
  [CategoryItemExtraDef.dataTypes.number]: 100,
  [CategoryItemExtraDef.dataTypes.text]: 'Text Value',
  [CategoryItemExtraDef.dataTypes.geometryPoint]: Points.toString(
    PointFactory.createInstance({ x: 12.48902, y: 41.88302, srs: '4326' })
  ),
}

export const CategoryImportTemplateGenerator = {
  generateTemplate,
}
