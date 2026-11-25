import { Query } from '@common/model/query'
import { FileFormats } from '@core/fileFormats'
import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Taxon from '@core/survey/taxon'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as RB from '../../utils/recordBuilder'
import * as SB from '../../utils/surveyBuilder'
import { getContextUser } from '../config/context'

const { nodeDefType } = NodeDef
const cycle = Survey.cycleOneKey

const taxonomyBuilder = SB.taxonomy('flora_taxonomy').taxa(
  SB.taxon('AGR', 'Poaceae', 'Agrostis', 'Agrostis capillaris'),
  SB.taxon('FES', 'Poaceae', 'Festuca', 'Festuca rubra'),
  SB.taxon(Taxon.unlistedCode, 'Unlisted', 'Unlisted', 'Unlisted')
)

const speciesValue = (code: string, scientificName?: string) => {
  const taxon = taxonomyBuilder.build().taxa.find((_taxon: any) => Taxon.getCode(_taxon) === code)
  return { ...Node.newNodeValueTaxon({ taxonUuid: Taxon.getUuid(taxon) }), scientificName }
}

describe('Multiple taxon attribute', () => {
  let survey: any = null

  const getDefUuid = (name: string) => NodeDef.getUuid(Survey.getNodeDefByName(name)(survey))

  const fetchRows = async (entityDefName: string, attributeDefNames: string[]): Promise<any[]> => {
    const query = Query.create({
      entityDefUuid: getDefUuid(entityDefName),
      attributeDefUuids: attributeDefNames.map(getDefUuid),
    })
    const user = getContextUser()
    return SurveyRdbService.fetchViewData({ user, surveyId: Survey.getId(survey), cycle, query } as any)
  }

  beforeAll(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'plot',
        SB.attribute('plot_id', nodeDefType.integer).key(),
        SB.attribute('remarks'),
        SB.attribute('species', nodeDefType.taxon).taxonomy('flora_taxonomy').multiple()
      )
    )
      .taxonomies(taxonomyBuilder)
      .buildAndStore()

    await RB.record(
      user,
      survey,
      RB.entity(
        'plot',
        RB.attribute('plot_id', 1),
        RB.attribute('remarks', 'grassland'),
        RB.attribute('species', speciesValue('AGR')),
        RB.attribute('species', speciesValue('FES')),
        RB.attribute('species', speciesValue(Taxon.unlistedCode, 'Rumex acetosella'))
      )
    ).buildAndStore()

    await RB.record(
      user,
      survey,
      RB.entity('plot', RB.attribute('plot_id', 2), RB.attribute('species', speciesValue('AGR')))
    ).buildAndStore()
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('every value is a row of the attribute data', async () => {
    const rows = await fetchRows('species', ['plot_id', 'species'])

    const values = rows
      .map((row) => [Number(row.plot_id), row.species, row.species_scientific_name])
      .sort((rowA, rowB) => rowA.join().localeCompare(rowB.join()))
    expect(values).toEqual([
      [1, 'AGR', 'Agrostis capillaris'],
      [1, 'FES', 'Festuca rubra'],
      [1, Taxon.unlistedCode, 'Rumex acetosella'],
      [2, 'AGR', 'Agrostis capillaris'],
    ])
  })

  test('the parent entity data has one row per entity', async () => {
    const rows = await fetchRows('plot', ['plot_id', 'remarks'])

    const values = rows
      .map((row) => [Number(row.plot_id), row.remarks])
      .sort(([plotIdA], [plotIdB]) => plotIdA - plotIdB)
    expect(values).toEqual([
      [1, 'grassland'],
      [2, null],
    ])
  })

  test('data export with expanded category items writes the attribute values in their own file', async () => {
    const outputDir = FileUtils.newTempFolderPath()
    await FileUtils.mkdir(outputDir)
    try {
      await SurveyRdbService.fetchEntitiesDataToCsvFiles({
        user: getContextUser(),
        survey,
        cycle,
        options: { fileFormat: FileFormats.csv, expandCategoryItems: true } as any,
        outputDir,
      })
      const plotHeader = (await FileUtils.readFile(FileUtils.join(outputDir, '01_plot.csv'))).split(/\r?\n/)[0]
      expect(plotHeader).not.toContain('species')

      const speciesLines = (await FileUtils.readFile(FileUtils.join(outputDir, '02_species.csv'))).trim().split(/\r?\n/)
      expect(speciesLines.length).toBe(5) // header and 4 values
    } finally {
      await FileUtils.rmdir(outputDir)
    }
  })
})
