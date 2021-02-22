import fs from 'fs'
import path from 'path'

import PromiseUtils from '../PromiseUtils'
import { checkFileAndGetContent } from './utils'

const checkLevelAndReturnLevel = async ({ levels, levelName, index }) => {
  const level = levels.find((_level) => _level.props.name === levelName)
  await expect(level).toBeTruthy()
  await expect(level.props.name).toBe(levelName)
  await expect(level.props.index).toBe(index)
  return level
}

// Country level
const checkItemCountryLevel = async ({ item }) => {
  const { parentUuid, props } = item
  const { code, labels } = props
  await expect(parentUuid).toBe(null)
  await expect(code).toBe('00')
  await expect(labels.en).toBe('(00) Country')
}
const getItemsCountryLevel = ({ administrativeUnitItems, countryLevel }) =>
  administrativeUnitItems.filter((item) => item.uuid === countryLevel.uuid)

const checkItemsCountryLevel = async ({ itemsCountryLevel }) => {
  await expect(itemsCountryLevel.length).toBe(1)
  await PromiseUtils.each(itemsCountryLevel, async (item) => checkItemCountryLevel({ item }))
}

// Region level
const checkItemRegionLevel = async ({ item, index, regionLevel, parentUuid }) => {
  await expect(item.parentUuid).toBe(parentUuid)
  await expect(item.levelUuid).toBe(regionLevel.uuid)
  const code = `0${index + 1}`
  await expect(item.props.code).toBe(`${code}`)
  await expect(item.props.label.en).toBe(`(${code}) Region ${code}`)
}

const getItemsRegionLevel = ({ regionLevel, administrativeUnitItems }) =>
  administrativeUnitItems.filter((item) => item.levelUuid === regionLevel.uuid)

const checkItemsRegionLevel = async ({ regionLevel, itemsCountryLevel, itemsRegionLevel }) => {
  await expect(itemsRegionLevel.length).toBe(5)

  const parent = itemsCountryLevel[0]
  await PromiseUtils.each(itemsRegionLevel, async (item, index) =>
    checkItemRegionLevel({ item, index, regionLevel, parentUuid: parent.uuid })
  )
}

// District level
const checkItemDistrictLevel = async ({ item, index, itemsRegionLevel, districtLevel }) => {
  const { parentUuid, levelUuid } = item
  await expect(parentUuid).toBe(itemsRegionLevel[Math.floor(index / 5)].uuid)
  await expect(levelUuid).toBe(districtLevel.uuid)
  const code = `0${Math.floor(index / 5) + 1}0${(index % 5) + 1}`
  await expect(item.props.code).toBe(code)
  await expect(item.props.labels.en).toBe(`(${code}) District ${code}`)
}

const getItemsDistrictLevel = ({ districtLevel, administrativeUnitItems }) =>
  administrativeUnitItems.filter((item) => item.levelUuid === districtLevel.uuid)

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

  const administrativeUnitCategory = categoriesAsArray.find((category) => category.props.name === 'administrative_unit')

  const { uuid: administrativeUnitUuid, levels } = administrativeUnitCategory

  await expect(
    fs.existsSync(path.join(surveyExtractedPath, 'categories', `${administrativeUnitUuid}.json`))
  ).toBeTruthy()

  const levelsAsArray = [...(Object.values(levels) || [])]
  await expect(levelsAsArray.length).toBe(3)

  await expect(Math.max((administrativeUnitCategory.levels || []).length, administrativeUnitCategory.levelsCount)).toBe(
    3
  )

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
