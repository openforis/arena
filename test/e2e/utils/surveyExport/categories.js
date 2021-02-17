import * as CategoryLevel from '@core/survey/categoryLevel'
import fs from 'fs'
import path from 'path'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as PromiseUtils from '@core/promiseUtils'

import { checkFileAndGetContent } from './utils'

const checkLevelAndReturnLevel = async ({ levels, levelName, index }) => {
  const level = levels.find((_level) => CategoryLevel.getName(_level) === levelName)
  await expect(level).toBeTruthy()
  await expect(CategoryLevel.getName(level)).toBe(levelName)
  await expect(CategoryLevel.getIndex(level)).toBe(index)
  return level
}

// Country level
const checkItemCountryLevel = async ({ item }) => {
  await expect(CategoryItem.getParentUuid(item)).toBe(null)
  await expect(CategoryItem.getCode(item)).toBe('00')
  await expect(CategoryItem.getLabel('en')(item)).toBe('(00) Country')
}
const getItemsCountryLevel = ({ administrativeUnitItems, countryLevel }) =>
  administrativeUnitItems.filter((item) => CategoryItem.getLevelUuid(item) === CategoryLevel.getUuid(countryLevel))

const checkItemsCountryLevel = async ({ itemsCountryLevel }) => {
  await expect(itemsCountryLevel.length).toBe(1)
  await PromiseUtils.each(itemsCountryLevel, async (item) => checkItemCountryLevel({ item }))
}

// Region level
const checkItemRegionLevel = async ({ item, index, regionLevel, parentUuid }) => {
  await expect(CategoryItem.getParentUuid(item)).toBe(parentUuid)
  await expect(CategoryItem.getLevelUuid(item)).toBe(CategoryLevel.getUuid(regionLevel))
  const code = `0${index + 1}`
  await expect(CategoryItem.getCode(item)).toBe(`${code}`)
  await expect(CategoryItem.getLabel('en')(item)).toBe(`(${code}) Region ${code}`)
}

const getItemsRegionLevel = ({ regionLevel, administrativeUnitItems }) =>
  administrativeUnitItems.filter((item) => CategoryItem.getLevelUuid(item) === CategoryLevel.getUuid(regionLevel))

const checkItemsRegionLevel = async ({ regionLevel, itemsCountryLevel, itemsRegionLevel }) => {
  await expect(itemsRegionLevel.length).toBe(5)

  const parent = itemsCountryLevel[0]
  await PromiseUtils.each(itemsRegionLevel, async (item, index) =>
    checkItemRegionLevel({ item, index, regionLevel, parentUuid: CategoryItem.getUuid(parent) })
  )
}

// District level
const checkItemDistrictLevel = async ({ item, index, itemsRegionLevel, districtLevel }) => {
  await expect(CategoryItem.getParentUuid(item)).toBe(CategoryItem.getUuid(itemsRegionLevel[Math.floor(index / 5)]))
  await expect(CategoryItem.getLevelUuid(item)).toBe(CategoryLevel.getUuid(districtLevel))
  const code = `0${Math.floor(index / 5) + 1}0${(index % 5) + 1}`
  await expect(CategoryItem.getCode(item)).toBe(code)
  await expect(CategoryItem.getLabel('en')(item)).toBe(`(${code}) District ${code}`)
}

const getItemsDistrictLevel = ({ districtLevel, administrativeUnitItems }) =>
  administrativeUnitItems.filter((item) => CategoryItem.getLevelUuid(item) === CategoryLevel.getUuid(districtLevel))

const checkItemsDistrictLevel = async ({ itemsDistrictLevel, itemsRegionLevel, districtLevel }) => {
  await expect(itemsDistrictLevel.length).toBe(25)

  await PromiseUtils.each(itemsDistrictLevel, async (item, index) =>
    checkItemDistrictLevel({ item, index, itemsRegionLevel, districtLevel })
  )
}

export const checkCategories = async ({ surveyExtractedPath }) => {
  await expect(fs.existsSync(path.join(surveyExtractedPath, 'categories'))).toBeTruthy()

  const content = fs.readFileSync(path.join(surveyExtractedPath, 'categories', 'categories.json'), 'utf8')
  const categories = JSON.parse(content)
  const categoriesAsArray = Object.values(categories)

  await expect(categoriesAsArray.length).toBe(1)

  const administrativeUnitCategory = categoriesAsArray.find(
    (category) => Category.getName(category) === 'administrative_unit'
  )

  const administrativeUnitUuid = Category.getUuid(administrativeUnitCategory)

  await expect(
    fs.existsSync(path.join(surveyExtractedPath, 'categories', `${administrativeUnitUuid}.json`))
  ).toBeTruthy()

  const levels = Category.getLevelsArray(administrativeUnitCategory)

  await expect(levels.length).toBe(3)
  await expect(Category.getLevelsCount(administrativeUnitCategory)).toBe(3)

  const [countryLevel, regionLevel, districtLevel] = await Promise.all(
    ['country', 'region', 'district'].map(async (levelName, index) =>
      checkLevelAndReturnLevel({ levels, levelName, index })
    )
  )

  const administrativeUnitItems = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'categories', `${administrativeUnitUuid}.json`),
  })

  // check items countryLevel
  const itemsCountryLevel = getItemsCountryLevel({ administrativeUnitItems, countryLevel })
  await checkItemsCountryLevel({ itemsCountryLevel, countryLevel })

  // check items itemsRegionLevel
  const itemsRegionLevel = getItemsRegionLevel({ administrativeUnitItems, regionLevel })
  await checkItemsRegionLevel({ regionLevel, itemsCountryLevel, itemsRegionLevel })

  // check items itemsDistrictLevel
  const itemsDistrictLevel = getItemsDistrictLevel({ administrativeUnitItems, districtLevel })
  await checkItemsDistrictLevel({ itemsDistrictLevel, itemsRegionLevel, districtLevel })
}
