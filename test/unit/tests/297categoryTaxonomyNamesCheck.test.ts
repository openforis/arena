import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

const nameInvalidKey = Validation.messageKeys.nameInvalid
const languageCodeInvalidKey = 'survey.languageCodeInvalid'

const extraDefs = (...names: string[]) =>
  Object.fromEntries(names.map((name) => [name, ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text })]))

const getError = (fn: () => void) => {
  try {
    fn()
    return null
  } catch (error: any) {
    return { key: error.key, params: error.params, statusCode: error.statusCode }
  }
}

const badRequest = (key: string, params: Record<string, unknown>) => ({ key, params, statusCode: 400 })

describe('Validator.checkNamesAreValid', () => {
  test('names with only lowercase letters, numbers and "_" and blank names are accepted', () => {
    // names being typed (e.g. starting with a number) are reported by the validation
    expect(
      getError(() => Validator.checkNamesAreValid(['region', 'level_1', '1st_level', '_', '', null, undefined]))
    ).toBeNull()
  })

  test.each(['Region', 'area (ha)', "x'y", '../x', 12])('name %p is rejected', (name) => {
    expect(getError(() => Validator.checkNamesAreValid(['region', name]))).toEqual(badRequest(nameInvalidKey, { name }))
  })
})

describe('Category names check', () => {
  const newLevel = ({ name = 'region', propsDraft = {} } = {}) => ({
    ...Category.newLevel(Category.newCategory(), { [CategoryLevel.keysProps.name]: name }, 0),
    propsDraft,
  })
  const checkItemExtraDef =
    (...names: string[]) =>
    () =>
      CategoryManager.checkCategoryProp(Category.keysProps.itemExtraDef, extraDefs(...names))

  test('valid level and extra prop names are accepted', () => {
    expect(getError(checkItemExtraDef('area', 'pop_2020'))).toBeNull()
    expect(getError(() => CategoryManager.checkLevel(newLevel({ name: 'district' })))).toBeNull()
  })

  test('invalid extra prop names are rejected', () => {
    expect(getError(checkItemExtraDef('area', 'pop 2020'))).toEqual(badRequest(nameInvalidKey, { name: 'pop 2020' }))
  })

  test('invalid level names are rejected, also in the draft props', () => {
    expect(getError(() => CategoryManager.checkLevel(newLevel({ name: 'Region' })))).toEqual(
      badRequest(nameInvalidKey, { name: 'Region' })
    )
    expect(getError(() => CategoryManager.checkLevel(newLevel({ propsDraft: { name: 'x"y' } })))).toEqual(
      badRequest(nameInvalidKey, { name: 'x"y' })
    )
    expect(getError(() => CategoryManager.checkLevelProp(CategoryLevel.keysProps.name, 'a b'))).toEqual(
      badRequest(nameInvalidKey, { name: 'a b' })
    )
  })

  test('category names are checked, other props are not', () => {
    expect(getError(() => CategoryManager.checkCategoryProp(Category.keysProps.name, 'Any Name'))).toEqual(
      badRequest(nameInvalidKey, { name: 'Any Name' })
    )
    expect(getError(() => CategoryManager.checkCategoryProp(Category.keysProps.designerNotes, 'Any Text'))).toBeNull()
    expect(getError(() => CategoryManager.checkLevelProp('other', 'Any Value'))).toBeNull()
  })
})

describe('Taxonomy check', () => {
  test('ISO 639-2 vernacular language codes and valid extra prop names are accepted', () => {
    const taxonomy = Taxonomy.newTaxonomy({
      [Taxonomy.keysProps.name]: 'trees',
      [Taxonomy.keysProps.vernacularLanguageCodes]: ['eng', 'swa', 'lat'],
      [Taxonomy.keysProps.extraPropsDefs]: extraDefs('max_height'),
    })
    expect(getError(() => TaxonomyManager.checkTaxonomy(taxonomy))).toBeNull()
  })

  test.each([[['eng', 'en']], [['eng', 'default']], [['eng', "x'y"]]])(
    'vernacular language codes %j are rejected',
    (codes) => {
      const taxonomy = Taxonomy.newTaxonomy({ [Taxonomy.keysProps.vernacularLanguageCodes]: codes })
      expect(getError(() => TaxonomyManager.checkTaxonomy(taxonomy))).toEqual(
        badRequest(languageCodeInvalidKey, { lang: codes[1] })
      )
    }
  )

  test('invalid extra prop names are rejected, also in the draft props', () => {
    const taxonomy = {
      ...Taxonomy.newTaxonomy({ [Taxonomy.keysProps.extraPropsDefs]: extraDefs('max_height') }),
      propsDraft: { [Taxonomy.keysProps.extraPropsDefs]: extraDefs('max_height', 'Max Height') },
    }
    expect(getError(() => TaxonomyManager.checkTaxonomy(taxonomy))).toEqual(
      badRequest(nameInvalidKey, { name: 'Max Height' })
    )
    expect(getError(() => TaxonomyManager.checkTaxonomyProp(Taxonomy.keysProps.name, 'trees/x'))).toEqual(
      badRequest(nameInvalidKey, { name: 'trees/x' })
    )
  })
})
