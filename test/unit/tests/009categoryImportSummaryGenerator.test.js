import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as CategoryImportSummaryGenerator from '@server/modules/category/manager/categoryImportSummaryGenerator'

const { newSummary, newItem } = CategoryImportSummary
const { code, label, description, extra } = CategoryImportSummary.itemTypes
const { text } = ExtraPropDef.dataTypes

describe('CategoryImportSummaryGenerator Test', () => {
  const columnNamesTests = [
    { title: 'empty column names', columns: [], error: true },
    {
      title: 'flat code list',
      columns: ['region_code'],
      summary: newSummary({
        items: [
          newItem({ key: 'region_code', columns: ['region_code'], type: code, levelName: 'region', levelIndex: 0 }),
        ],
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
        items: [
          newItem({ key: 'region_code', columns: ['region_code'], type: code, levelName: 'region', levelIndex: 0 }),
          newItem({ key: 'label_en', columns: ['label_en'], type: label, levelIndex: -1, lang: 'en' }),
        ],
      }),
    },
    {
      title: 'flat code list with label in default language',
      columns: ['region_code', 'label'],
      summary: newSummary({
        items: [
          newItem({ key: 'region_code', columns: ['region_code'], type: code, levelName: 'region', levelIndex: 0 }),
          newItem({ key: 'label', columns: ['label'], type: label, levelIndex: -1, lang: null }),
        ],
      }),
    },
    {
      title: 'flat code list with label and description',
      columns: ['region_code', 'label_en', 'description_en'],
      summary: newSummary({
        items: [
          newItem({ key: 'region_code', columns: ['region_code'], type: code, levelName: 'region', levelIndex: 0 }),
          newItem({ key: 'label_en', columns: ['label_en'], type: label, levelIndex: -1, lang: 'en' }),
          newItem({
            key: 'description_en',
            columns: ['description_en'],
            type: description,
            levelIndex: -1,
            lang: 'en',
          }),
        ],
      }),
    },
    {
      title: 'flat code list with label, description and extras',
      columns: ['region_code', 'label_en', 'description_en', 'extra_1', 'extra_2'],
      summary: newSummary({
        items: [
          newItem({ key: 'region_code', columns: ['region_code'], type: code, levelName: 'region', levelIndex: 0 }),
          newItem({ key: 'label_en', columns: ['label_en'], type: label, levelIndex: -1, lang: 'en' }),
          newItem({
            key: 'description_en',
            columns: ['description_en'],
            type: description,
            levelIndex: -1,
            lang: 'en',
          }),
          newItem({ key: 'extra_1', columns: ['extra_1'], type: extra, dataType: text }),
          newItem({ key: 'extra_2', columns: ['extra_2'], type: extra, dataType: text }),
        ],
      }),
    },
    {
      title: 'hierarchical code list',
      columns: ['region_code', 'province_code', 'district_code'],
      summary: newSummary({
        items: [
          newItem({ key: 'region_code', columns: ['region_code'], type: code, levelName: 'region', levelIndex: 0 }),
          newItem({
            key: 'province_code',
            columns: ['province_code'],
            type: code,
            levelName: 'province',
            levelIndex: 1,
          }),
          newItem({
            key: 'district_code',
            columns: ['district_code'],
            type: code,
            levelName: 'district',
            levelIndex: 2,
          }),
        ],
      }),
    },
    {
      title: 'hierarchical code list full',
      columns: ['region_code', 'province_code', 'district_code', 'label_en', 'extra_1', 'extra_2', 'extra_3'],
      summary: newSummary({
        items: [
          newItem({ key: 'region_code', columns: ['region_code'], type: code, levelName: 'region', levelIndex: 0 }),
          newItem({
            key: 'province_code',
            columns: ['province_code'],
            type: code,
            levelName: 'province',
            levelIndex: 1,
          }),
          newItem({
            key: 'district_code',
            columns: ['district_code'],
            type: code,
            levelName: 'district',
            levelIndex: 2,
          }),
          newItem({ key: 'label_en', columns: ['label_en'], type: label, levelIndex: -1, lang: 'en' }),
          newItem({ key: 'extra_1', columns: ['extra_1'], type: extra, dataType: text }),
          newItem({ key: 'extra_2', columns: ['extra_2'], type: extra, dataType: text }),
          newItem({ key: 'extra_3', columns: ['extra_3'], type: extra, dataType: text }),
        ],
      }),
    },
    {
      title: 'sampling point data',
      columns: ['level1_code', 'level2_code', 'level3_code', 'x', 'y', 'srs_id'],
      summary: newSummary({
        items: [
          newItem({ key: 'level1_code', columns: ['level1_code'], type: code, levelName: 'level1', levelIndex: 0 }),
          newItem({
            key: 'level2_code',
            columns: ['level2_code'],
            type: code,
            levelName: 'level2',
            levelIndex: 1,
          }),
          newItem({
            key: 'level3_code',
            columns: ['level3_code'],
            type: code,
            levelName: 'level3',
            levelIndex: 2,
          }),
          newItem({
            key: 'x',
            columns: ['x'],
            type: extra,
            dataType: text,
          }),
          newItem({
            key: 'y',
            columns: ['y'],
            type: extra,
            dataType: text,
          }),
          newItem({
            key: 'srs_id',
            columns: ['srs_id'],
            type: extra,
            dataType: text,
          }),
        ],
      }),
    },
    {
      title: 'sampling point data with whatever extra',
      columns: ['level1_code', 'level2_code', 'level3_code', 'x', 'y', 'srs_id', 'region', 'region_label'],
      codeColumnPattern: /(level\d+)_code/,
      ignoreLabelsAndDescriptions: true,
      summary: newSummary({
        items: [
          newItem({ key: 'level1_code', columns: ['level1_code'], type: code, levelName: 'level1', levelIndex: 0 }),
          newItem({ key: 'level2_code', columns: ['level2_code'], type: code, levelName: 'level2', levelIndex: 1 }),
          newItem({ key: 'level3_code', columns: ['level3_code'], type: code, levelName: 'level3', levelIndex: 2 }),
          newItem({
            key: 'x',
            columns: ['x'],
            type: extra,
            dataType: text,
          }),
          newItem({
            key: 'y',
            columns: ['y'],
            type: extra,
            dataType: text,
          }),
          newItem({
            key: 'srs_id',
            columns: ['srs_id'],
            type: extra,
            dataType: text,
          }),
          newItem({
            key: 'region',
            columns: ['region'],
            type: extra,
            dataType: text,
          }),
          newItem({
            key: 'region_label',
            columns: ['region_label'],
            type: extra,
            dataType: text,
          }),
        ],
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
