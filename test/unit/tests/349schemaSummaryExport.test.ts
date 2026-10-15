import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { FileFormats } from '@core/fileFormats'

import {
  neutraliseSpreadsheetFormula,
  parseAiDescriptions,
} from '@server/modules/survey/service/schemaSummary/aiDescriptions'
import {
  buildSchemaSummaryItems,
  generateSchemaSummaryItems,
} from '@server/modules/survey/service/schemaSummary/schemaSummary'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import * as SB from '../../utils/surveyBuilder'

const user = { uuid: 'test-schema-summary-export-user' }
const cycle = Survey.cycleOneKey

const buildSurvey = () =>
  SB.survey(
    user,
    SB.entity('cluster', SB.attribute('cluster_id', NodeDef.nodeDefType.decimal), SB.attribute('notes'))
  ).build()

const uuidOf = (survey: any, name: string): string =>
  NodeDef.getUuid(Survey.getNodeDefsArray(survey).find((nodeDef: any) => NodeDef.getName(nodeDef) === name))

describe('schema summary export (349)', () => {
  describe('the draft survey is loaded once per export', () => {
    // the survey manager is a dependency of the export: the unit tests give it a fake survey
    const fetchSurvey = jest.fn()
    const deps = { fetchSurvey }
    let survey: any

    beforeEach(async () => {
      survey = await buildSurvey()
      fetchSurvey.mockReset()
      fetchSurvey.mockResolvedValue(survey)
    })

    test('the rows and the check of the AI descriptions use the same load', async () => {
      const aiDescriptions = { [uuidOf(survey, 'cluster_id')]: 'The cluster number.' }

      const items = await generateSchemaSummaryItems({ surveyId: 1, cycle, aiDescriptions }, deps)

      expect(fetchSurvey).toHaveBeenCalledTimes(1)
      expect(items.find((item: any) => item.name === 'cluster_id').aiDescription).toBe('The cluster number.')
    })

    test('an unknown uuid is still refused, with the same error as before', async () => {
      await expectSystemErrorKey(
        () => generateSchemaSummaryItems({ surveyId: 1, cycle, aiDescriptions: { 'not-a-node-def': 'D.' } }, deps),
        'aiDescriptionsInvalid'
      )
      expect(fetchSurvey).toHaveBeenCalledTimes(1)
    })

    test('an export without AI descriptions needs no check', async () => {
      const items = await generateSchemaSummaryItems({ surveyId: 1, cycle }, deps)
      expect(items.some((item: any) => 'aiDescription' in item)).toBe(false)
      expect(fetchSurvey).toHaveBeenCalledTimes(1)
    })
  })

  test('the request check of the descriptions does not need the survey: the uuids are checked at the export', () => {
    expect(parseAiDescriptions({ raw: { anyUuid: 'D.' } })).toEqual({ anyUuid: 'D.' })
    expect(() => parseAiDescriptions({ raw: { anyUuid: 3 } })).toThrow()
  })

  describe('spreadsheet formulas in the AI descriptions are neutralised (csv only)', () => {
    test.each(['=1+1', '+SUM(A1:A9)', '-2+3', '@SUM(A1)', '\t=1', '\r=1'])('%j starts with a quote', (text) => {
      expect(neutraliseSpreadsheetFormula(text)).toBe(`'${text}`)
    })

    test.each(['The cluster number.', 'a = b', 'x+y', '', ' =1', "'quoted"])('%j is kept', (text) => {
      expect(neutraliseSpreadsheetFormula(text)).toBe(text)
    })

    const hostile = '=HYPERLINK("http://evil.example","x")'
    const buildWith = async (fileFormat?: string) => {
      const survey = await buildSurvey()
      const items = buildSchemaSummaryItems({
        survey,
        cycle,
        aiDescriptions: { [uuidOf(survey, 'cluster_id')]: hostile },
        ...(fileFormat ? { fileFormat } : {}),
      })
      return Object.fromEntries(items.map((item: any) => [item.name, item]))
    }

    test('csv: the aiDescription column holds the neutralised text; the other columns are untouched', async () => {
      const byName = await buildWith(FileFormats.csv)
      expect(byName.cluster_id.aiDescription).toBe(`'${hostile}`)
      expect(byName.notes.aiDescription).toBe('')
    })

    test('xlsx: the text is written as it is (a cell is a string, the quote would show up)', async () => {
      const byName = await buildWith(FileFormats.xlsx)
      expect(byName.cluster_id.aiDescription).toBe(hostile)
    })

    test('without a format the text is neutralised (the safe default)', async () => {
      const byName = await buildWith()
      expect(byName.cluster_id.aiDescription).toBe(`'${hostile}`)
    })
  })
})
