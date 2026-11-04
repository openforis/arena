import { Readable } from 'node:stream'

import ExcelJS from 'exceljs'

import { FileFormats } from '@core/fileFormats'
import * as Expression from '@core/expressionParser/expression'
import * as Node from '@core/record/node'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Taxon from '@core/survey/taxon'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import * as FileUtils from '@server/utils/file/fileUtils'

import { getContextUser } from '../config/context'

import * as RB from '../../utils/recordBuilder'
import * as SB from '../../utils/surveyBuilder'

const { nodeDefType } = NodeDef
const cycle = Survey.cycleOneKey

const taxonomyBuilder = SB.taxonomy('flora_taxonomy').taxa(
  SB.taxon('AGR', 'Poaceae', 'Agrostis', 'Agrostis capillaris'),
  SB.taxon(Taxon.unlistedCode, 'Unlisted', 'Unlisted', 'Unlisted')
)
const layersBuilder = SB.category('layers')
  .levels('level_1')
  .items(...['6', '9'].map((code) => SB.categoryItem(code)))
const coversBuilder = SB.category('covers')
  .levels('level_1')
  .items(...['2', '3', '4', '5', '7'].map((code) => SB.categoryItem(code)))

const findCodeValue = (categoryBuilder: any, code: string) => {
  const item = categoryBuilder.build().items.find((_item: any) => CategoryItem.getCode(_item) === code)
  return Node.newNodeValueCode({ itemUuid: CategoryItem.getUuid(item) })
}

const findTaxonValue = (code: string, scientificName?: string) => {
  const taxon = taxonomyBuilder.build().taxa.find((_taxon: any) => Taxon.getCode(_taxon) === code)
  return { ...Node.newNodeValueTaxon({ taxonUuid: Taxon.getUuid(taxon) }), scientificName }
}

let floraRowNo = 0

const floraBuilder = (species: object, layer: string, cover: string) =>
  RB.entity(
    'flora',
    RB.attribute('flora_row_no', ++floraRowNo),
    RB.attribute('species', species),
    RB.attribute('layer', findCodeValue(layersBuilder, layer)),
    RB.attribute('cover', findCodeValue(coversBuilder, cover))
  )

describe('Data matrix export', () => {
  let survey: any = null

  const getDefUuid = (name: string) => NodeDef.getUuid(Survey.getNodeDefByName(name)(survey))

  const getOptions = (fileFormat: string, filter: string | null = null) => ({
    entityDefUuid: getDefUuid('flora'),
    rowAttributeDefUuids: [getDefUuid('species'), getDefUuid('layer')],
    recordKeyAttributeDefUuids: [getDefUuid('relevee_id')],
    valueAttributeDefUuid: getDefUuid('cover'),
    // same expression format as the Data Explorer filter
    filter: filter ? Expression.fromString(filter) : null,
    fileFormat,
  })

  const exportMatrix = async (options: object) => {
    const user = getContextUser()
    const tempFileName = await SurveyRdbService.exportDataMatrixToTempFile({ user, survey, cycle, options } as any)
    return FileUtils.tempFilePath(tempFileName)
  }

  const exportMatrixHeader = async (options: object) => {
    const filePath = await exportMatrix(options)
    const content = await FileUtils.readFile(filePath)
    await FileUtils.deleteFile(filePath)
    return content.split(/\r?\n/)[0]
  }

  const expectedRows = [
    ['species_scientific_name', 'layer', 'A', 'B'],
    ['Agrostis capillaris', '6', '5', '2'],
    ['Agrostis capillaris', '9', '', '3'],
    ['Cerastium glomeratum', '6', '4', ''],
    ['Rumex acetosella', '6', '7', ''],
  ]

  beforeAll(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'relevee',
        SB.attribute('relevee_id').key(),
        SB.attribute('relevee_no', nodeDefType.integer).key(),
        SB.attribute('location', nodeDefType.coordinate),
        SB.entity(
          'flora',
          SB.attribute('flora_row_no', nodeDefType.integer).key(),
          SB.attribute('species', nodeDefType.taxon).taxonomy('flora_taxonomy'),
          SB.attribute('layer', nodeDefType.code).category('layers'),
          SB.attribute('cover', nodeDefType.code).category('covers')
        ).multiple()
      )
    )
      .taxonomies(taxonomyBuilder)
      .categories(layersBuilder, coversBuilder)
      .buildAndStore()

    await RB.record(
      user,
      survey,
      RB.entity(
        'relevee',
        RB.attribute('relevee_id', 'A'),
        RB.attribute('relevee_no', 1),
        floraBuilder(findTaxonValue('AGR'), '6', '5'),
        // unlisted species have the same code but they must not be merged
        floraBuilder(findTaxonValue(Taxon.unlistedCode, 'Rumex acetosella'), '6', '7'),
        floraBuilder(findTaxonValue(Taxon.unlistedCode, 'Cerastium glomeratum'), '6', '4')
      )
    ).buildAndStore()

    await RB.record(
      user,
      survey,
      RB.entity(
        'relevee',
        RB.attribute('relevee_id', 'B'),
        RB.attribute('relevee_no', 2),
        floraBuilder(findTaxonValue('AGR'), '6', '2'),
        floraBuilder(findTaxonValue('AGR'), '9', '3')
      )
    ).buildAndStore()

    await RB.record(
      user,
      survey,
      RB.entity('relevee', RB.attribute('relevee_id', 'C'), RB.attribute('relevee_no', 3))
    ).buildAndStore()
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('csv file has one row per species and layer and one column per record', async () => {
    const filePath = await exportMatrix(getOptions(FileFormats.csv))
    const content = await FileUtils.readFile(filePath)
    await FileUtils.deleteFile(filePath)

    const rows = content
      .trim()
      .split(/\r?\n/)
      .map((line: string) => line.split(',').map((cell: string) => cell.replaceAll('"', '')))
    expect(rows).toEqual(expectedRows)
  })

  test('xlsx file has the same content', async () => {
    const filePath = await exportMatrix(getOptions(FileFormats.xlsx))
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.read(Readable.from(await FileUtils.readBinaryFile(filePath)))
    await FileUtils.deleteFile(filePath)

    const rows: string[][] = []
    workbook.worksheets[0].eachRow((row) => {
      rows.push(expectedRows[0].map((_, index) => String(row.getCell(index + 1).value ?? '')))
    })
    expect(rows).toEqual(expectedRows)
  })

  test('only the data matching the filter is exported', async () => {
    const filePath = await exportMatrix(getOptions(FileFormats.csv, `relevee_id == 'B'`))
    const content = await FileUtils.readFile(filePath)
    await FileUtils.deleteFile(filePath)

    expect(content.split(/\r?\n/)[0]).toBe('"species_scientific_name","layer","B"')
    expect(content).not.toContain('Rumex')
  })

  test('record columns are named after the selected record keys', async () => {
    const options = { ...getOptions(FileFormats.csv), recordKeyAttributeDefUuids: [getDefUuid('relevee_no')] }
    expect(await exportMatrixHeader(options)).toBe('"species_scientific_name","layer","1","2"')
  })

  test('record columns are named after all the record keys when not specified', async () => {
    const options = { ...getOptions(FileFormats.csv), recordKeyAttributeDefUuids: undefined }
    expect(await exportMatrixHeader(options)).toBe('"species_scientific_name","layer","A - 1","B - 2"')
  })

  test('attributes other than the record keys cannot name the record columns', async () => {
    const options = { ...getOptions(FileFormats.csv), recordKeyAttributeDefUuids: [getDefUuid('flora_row_no')] }
    await expect(exportMatrix(options)).rejects.toThrow('Invalid data matrix record key attribute')
  })

  test('an export without rows is rejected', async () => {
    await expect(exportMatrix(getOptions(FileFormats.csv, `relevee_id == 'C'`))).rejects.toThrow(
      'dataExport.noRecordsMatchingSearchCriteria'
    )
  })

  test('attributes outside of the entity are rejected', async () => {
    const options = { ...getOptions(FileFormats.csv), valueAttributeDefUuid: getDefUuid('relevee_id') }
    await expect(exportMatrix(options)).rejects.toThrow('Invalid data matrix attribute')
  })

  test('coordinate attributes are rejected', async () => {
    const options = { ...getOptions(FileFormats.csv), valueAttributeDefUuid: getDefUuid('location') }
    await expect(exportMatrix(options)).rejects.toThrow('Invalid data matrix attribute')
  })
})
