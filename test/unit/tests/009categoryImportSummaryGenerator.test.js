import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as CategoryImportSummaryGenerator from '@server/modules/category/manager/categoryImportSummaryGenerator'

const { newSummary, newItem: newColumn } = CategoryImportSummary
const { code, label, description, extra } = CategoryImportSummary.itemTypes
const { text } = ExtraPropDef.dataTypes

describe('CategoryImportSummaryGenerator Test', () => {
  const columnNamesTests = [
    { title: 'empty column names', columns: [], error: true },
    {
      title: 'flat code list',
      columns: ['region_code'],
      summary: newSummary({
        [CategoryImportSummary.keys.columns]: {
          region_code: newColumn({ type: code, levelName: 'region', levelIndex: 0 }),
        },
      }),
    },
    {
      title: 'flat code list (missing column district_code)',
      columns: ['region_code', 'district_label'],
      error: true,
    },
    {
      title: 'flat code list with label',
      columns: ['region_code', 'label_en'],
      summary: newSummary({
        [CategoryImportSummary.keys.columns]: {
          region_code: newColumn({ type: code, levelName: 'region', levelIndex: 0 }),
          label_en: newColumn({ type: label, levelIndex: -1, lang: 'en' }),
        },
      }),
    },
    {
      title: 'flat code list with label in default language',
      columns: ['region_code', 'label'],
      summary: newSummary({
        [CategoryImportSummary.keys.columns]: {
          region_code: newColumn({ type: code, levelName: 'region', levelIndex: 0 }),
          label: newColumn({ type: label, levelIndex: -1, lang: null }),
        },
      }),
    },
    {
      title: 'flat code list with label and description',
      columns: ['region_code', 'label_en', 'description_en'],
      summary: newSummary({
        [CategoryImportSummary.keys.columns]: {
          region_code: newColumn({ type: code, levelName: 'region', levelIndex: 0 }),
          label_en: newColumn({ type: label, levelIndex: -1, lang: 'en' }),
          description_en: newColumn({ type: description, levelIndex: -1, lang: 'en' }),
        },
      }),
    },
    {
      title: 'flat code list with label, description and extras',
      columns: ['region_code', 'label_en', 'description_en', 'extra_1', 'extra_2'],
      summary: newSummary({
        [CategoryImportSummary.keys.columns]: {
          region_code: newColumn({ type: code, levelName: 'region', levelIndex: 0 }),
          label_en: newColumn({ type: label, levelIndex: -1, lang: 'en' }),
          description_en: newColumn({ type: description, levelIndex: -1, lang: 'en' }),
          extra_1: newColumn({ type: extra, dataType: text }),
          extra_2: newColumn({ type: extra, dataType: text }),
        },
      }),
    },
    {
      title: 'hierarchical code list',
      columns: ['region_code', 'province_code', 'district_code'],
      summary: newSummary({
        [CategoryImportSummary.keys.columns]: {
          region_code: newColumn({ type: code, levelName: 'region', levelIndex: 0 }),
          province_code: newColumn({ type: code, levelName: 'province', levelIndex: 1 }),
          district_code: newColumn({ type: code, levelName: 'district', levelIndex: 2 }),
        },
      }),
    },
    {
      title: 'hierarchical code list full',
      columns: [
        'region_code',
        'province_code',
        'district_code',
        'label_en',
        'label_en',
        'extra_1',
        'extra_2',
        'extra_3',
      ],
      summary: newSummary({
        [CategoryImportSummary.keys.columns]: {
          region_code: newColumn({ type: code, levelName: 'region', levelIndex: 0 }),
          province_code: newColumn({ type: code, levelName: 'province', levelIndex: 1 }),
          district_code: newColumn({ type: code, levelName: 'district', levelIndex: 2 }),
          label_en: newColumn({ type: label, levelIndex: -1, lang: 'en' }),
          extra_1: newColumn({ type: extra, dataType: text }),
          extra_2: newColumn({ type: extra, dataType: text }),
          extra_3: newColumn({ type: extra, dataType: text }),
        },
      }),
    },
    {
      title: 'sampling point data',
      columns: ['level1_code', 'level2_code', 'level3_code', 'x', 'y', 'srs_id'],
      summary: newSummary({
        [CategoryImportSummary.keys.columns]: {
          level1_code: newColumn({ type: code, levelName: 'level1', levelIndex: 0 }),
          level2_code: newColumn({ type: code, levelName: 'level2', levelIndex: 1 }),
          level3_code: newColumn({ type: code, levelName: 'level3', levelIndex: 2 }),
          x: newColumn({ type: extra, dataType: text }),
          y: newColumn({ type: extra, dataType: text }),
          srs_id: newColumn({ type: extra, dataType: text }),
        },
      }),
    },
    {
      title: 'sampling point data with whatever extra',
      columns: ['level1_code', 'level2_code', 'level3_code', 'x', 'y', 'srs_id', 'region', 'region_label'],
      codeColumnPattern: /(level\d+)_code/,
      ignoreLabelsAndDescriptions: true,
      summary: newSummary({
        [CategoryImportSummary.keys.columns]: {
          level1_code: newColumn({ type: code, levelName: 'level1', levelIndex: 0 }),
          level2_code: newColumn({ type: code, levelName: 'level2', levelIndex: 1 }),
          level3_code: newColumn({ type: code, levelName: 'level3', levelIndex: 2 }),
          x: newColumn({ type: extra, dataType: text }),
          y: newColumn({ type: extra, dataType: text }),
          srs_id: newColumn({ type: extra, dataType: text }),
          region: newColumn({ type: extra, dataType: text }),
          region_label: newColumn({ type: extra, dataType: text }),
        },
      }),
    },
  ]

  columnNamesTests.forEach((item) => {
    const {
      title,
      columns: columnNames,
      codeColumnPattern,
      ignoreLabelsAndDescriptions,
      summary: summaryExpected,
      error: errorExpected,
    } = item
    it(title, () => {
      try {
        const summary = CategoryImportSummaryGenerator.createImportSummaryFromColumnNames({
          columnNames,
          codeColumnPattern,
          ignoreLabelsAndDescriptions,
        })
        expect(summary).toStrictEqual(summaryExpected)
      } catch (e) {
        if (errorExpected) {
          expect(e).toBeDefined()
        } else {
          throw e
        }
      }
    })
  })
})
