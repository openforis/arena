import path from 'node:path'

import { getChainDirName, getChainDirPath, isPathInsideDir } from '@server/modules/analysis/service/rChain/rChainDir'

const chainUuid = '3f2a9b1c-1234-4abc-8def-0123456789ab'
const outputDir = path.resolve('/srv/arena/analysis')

describe('R chain folder name', () => {
  test('keeps lowercase letters, digits and underscores of the label, plus a part of the uuid', () => {
    expect(getChainDirName({ chainLabel: 'Volume Calculation 2024', chainUuid })).toBe(
      'volume_calculation_2024_3f2a9b1c'
    )
  })

  test('replaces path separators and dots', () => {
    expect(getChainDirName({ chainLabel: '../../etc', chainUuid })).toBe('etc_3f2a9b1c')
    expect(getChainDirName({ chainLabel: String.raw`a\b/c.d`, chainUuid })).toBe('a_b_c_d_3f2a9b1c')
  })

  test('uses only the uuid part when no character of the label is kept', () => {
    for (const chainLabel of ['..', '.', '/', '', '   ', 'Объём', null, undefined]) {
      expect(getChainDirName({ chainLabel, chainUuid })).toBe('3f2a9b1c')
    }
  })

  test('truncates long labels', () => {
    const name = getChainDirName({ chainLabel: 'x'.repeat(300), chainUuid })
    expect(name).toBe(`${'x'.repeat(40)}_3f2a9b1c`)
  })
})

describe('Path inside folder check', () => {
  test('accepts paths inside the folder', () => {
    expect(isPathInsideDir({ dir: outputDir, filePath: path.join(outputDir, 'survey', 'chain') })).toBe(true)
    expect(isPathInsideDir({ dir: outputDir, filePath: path.join(outputDir, '..name') })).toBe(true)
  })

  test('rejects the folder itself and paths outside it', () => {
    expect(isPathInsideDir({ dir: outputDir, filePath: outputDir })).toBe(false)
    expect(isPathInsideDir({ dir: outputDir, filePath: path.join(outputDir, '..') })).toBe(false)
    expect(isPathInsideDir({ dir: outputDir, filePath: path.join(outputDir, '..', 'other') })).toBe(false)
    expect(isPathInsideDir({ dir: outputDir, filePath: `${outputDir}_other` })).toBe(false)
    expect(isPathInsideDir({ dir: outputDir, filePath: path.resolve('/tmp') })).toBe(false)
  })
})

describe('R chain folder path', () => {
  test('is inside the survey folder in the output folder', () => {
    expect(getChainDirPath({ outputDir, surveyName: 'my_survey', chainLabel: 'Chain 1', chainUuid })).toBe(
      path.join(outputDir, 'my_survey', 'chain_1_3f2a9b1c')
    )
  })

  test('fails when the output folder is not set', () => {
    for (const dir of [undefined, '', ' ']) {
      expect(() =>
        getChainDirPath({ outputDir: dir, surveyName: 'my_survey', chainLabel: 'Chain', chainUuid })
      ).toThrow('ANALYSIS_OUTPUT_DIR')
    }
  })

  test('fails when the folder would be outside the output folder', () => {
    expect(() => getChainDirPath({ outputDir, surveyName: '..', chainLabel: 'Chain', chainUuid })).toThrow(
      'inside the analysis output folder'
    )
  })
})
