import { PointFactory, Points } from '@openforis/arena-core'

import { ArrayUtils } from '@core/arrayUtils'

import * as Category from '@core/survey/category'
import { CategoryExportFile } from '@core/survey/categoryExportFile'
import { ExtraPropDef } from '@core/survey/extraPropDef'

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
    ['extra_prop_text']: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }),
    ['extra_prop_number']: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.number }),
    ['extra_prop_geometry']: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint }),
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
        [extraDef.name]: templateExtraValueByType[ExtraPropDef.getDataType(extraDef)],
      }),
      {}
    ),
  }))
}

const templateExtraValueByType = {
  [ExtraPropDef.dataTypes.number]: 100,
  [ExtraPropDef.dataTypes.text]: 'Text Value',
  [ExtraPropDef.dataTypes.geometryPoint]: Points.toString(
    PointFactory.createInstance({ x: 12.48902, y: 41.88302, srs: '4326' })
  ),
}

export const CategoryImportTemplateGenerator = {
  generateTemplate,
}
