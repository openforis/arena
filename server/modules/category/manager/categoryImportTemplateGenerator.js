import { PointFactory, Points } from '@openforis/arena-core'

import { ArrayUtils } from '@core/arrayUtils'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { CategoryExportFile } from '@core/survey/categoryExportFile'
import { ExtraPropDef } from '@core/survey/extraPropDef'

const generateCategoryTemplate = () => {
  let category = Category.newCategory({ [Category.keysProps.name]: 'template' })
  // levels (1st level already created when creating the category)
  category = Category.assocLevel({ level: Category.newLevel(category) })(category)
  category = Category.assocLevel({ level: Category.newLevel(category) })(category)
  // extra props
  category = Category.assocItemExtraDef({
    ['extra_prop_text']: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }),
    ['extra_prop_number']: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.number }),
  })(category)
  return category
}

const generateSamplingPointDataCategoryTemplate = () => {
  let category = Category.newCategory({ [Category.keysProps.name]: 'template' })
  // levels (1st level already created when creating the category)
  category = Category.assocLevel({ level: Category.newLevel(category) })(category)
  category = Category.assocLevel({ level: Category.newLevel(category) })(category)
  // extra props
  category = Category.assocItemExtraDef({
    ['location_x']: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.number }),
    ['location_y']: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.number }),
    ['location_srs']: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }),
  })(category)
  return category
}

const templateExtraValueByType = {
  [ExtraPropDef.dataTypes.number]: 100,
  [ExtraPropDef.dataTypes.text]: 'Text Value',
  [ExtraPropDef.dataTypes.geometryPoint]: Points.toString(PointFactory.createInstance({ x: 12.48902, y: 41.88302 })),
}

const templateExtraValueGenerator = ({ extraDef }) => {
  const extraDefName = ExtraPropDef.getName(extraDef)

  if (extraDefName.endsWith('_x')) return 12.48902
  if (extraDefName.endsWith('_y')) return 41.88302
  if (extraDefName.endsWith('_srs')) return 'EPSG:4326'

  return templateExtraValueByType[ExtraPropDef.getDataType(extraDef)]
}

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

const generateExtraDefsForTemplate = (category) => {
  const extraDefs = Category.getItemExtraDefsArray(category)
  return extraDefs.reduce((acc, extraDef) => {
    if (ExtraPropDef.getDataType(extraDef) === ExtraPropDef.dataTypes.geometryPoint) {
      // split geometry point into 3 columns
      const extraDefName = ExtraPropDef.getName(extraDef)
      acc.push(
        { name: `${extraDefName}_x`, dataType: ExtraPropDef.dataTypes.number },
        { name: `${extraDefName}_y`, dataType: ExtraPropDef.dataTypes.number },
        { name: `${extraDefName}_srs`, dataType: ExtraPropDef.dataTypes.text }
      )
    } else {
      acc.push(extraDef)
    }
    return acc
  }, [])
}

const generateItems = ({ levels, numItemsPerLevel = 2 }) => generateDescendantItems({ levels, numItemsPerLevel })

const generateTemplate = ({ survey, category: categoryProp = null }) => {
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey))
  const category = categoryProp || generateCategoryTemplate()
  const levels = Category.getLevelsArray(category)
  const extraDefs = generateExtraDefsForTemplate(category)
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
        [extraDef.name]: templateExtraValueGenerator({ extraDef }),
      }),
      {}
    ),
  }))
}

const generateSamplingPointDataTemplate = ({ survey }) =>
  generateTemplate({ survey, category: generateSamplingPointDataCategoryTemplate() })

export const CategoryImportTemplateGenerator = {
  generateTemplate,
  generateSamplingPointDataTemplate,
}
