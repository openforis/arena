import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

describe('ExportFileNameGenerator.sanitizeFileNamePart', () => {
  test('replaces spaces and special characters with hyphens', () => {
    expect(ExportFileNameGenerator.sanitizeFileNamePart('Plot details')).toBe('Plot-details')
    expect(ExportFileNameGenerator.sanitizeFileNamePart("Parcelle d'essai")).toBe('Parcelle-d-essai')
    expect(ExportFileNameGenerator.sanitizeFileNamePart('A / B % C')).toBe('A-B-C')
  })

  test('collapses consecutive separators and trims edges', () => {
    expect(ExportFileNameGenerator.sanitizeFileNamePart('  --Plot  details--  ')).toBe('Plot-details')
    expect(ExportFileNameGenerator.sanitizeFileNamePart('---')).toBe('')
    expect(ExportFileNameGenerator.sanitizeFileNamePart('a---b___c...d')).toBe('a-b___c...d')
  })

  test('returns empty string for blank input', () => {
    expect(ExportFileNameGenerator.sanitizeFileNamePart('')).toBe('')
    expect(ExportFileNameGenerator.sanitizeFileNamePart('   ')).toBe('')
    expect(ExportFileNameGenerator.sanitizeFileNamePart(null)).toBe('')
    expect(ExportFileNameGenerator.sanitizeFileNamePart(undefined)).toBe('')
  })
})

describe('ExportFileNameGenerator.generate', () => {
  test('sanitizes itemName instead of URL-encoding it', () => {
    const fileName = ExportFileNameGenerator.generate({
      surveyName: 'nfi',
      cycle: '0',
      itemName: 'Plot details',
      extension: 'pdf',
    })
    expect(fileName).toBe('nfi_(cycle-1)_Plot-details.pdf')
    expect(fileName).not.toContain('%')
  })

  test('omits fileType when not provided for shorter printable names', () => {
    const fileName = ExportFileNameGenerator.generate({
      surveyName: 'nfi',
      cycle: '0',
      extension: 'pdf',
    })
    expect(fileName).toBe('nfi_(cycle-1).pdf')
    expect(fileName).not.toContain('RecordForm')
  })

  test('keeps fileType when provided for other exports', () => {
    const fileName = ExportFileNameGenerator.generate({
      surveyName: 'nfi',
      cycle: '0',
      itemName: 'land_use',
      fileType: 'Category',
      extension: 'csv',
    })
    expect(fileName).toBe('nfi_(cycle-1)_land_use_Category.csv')
  })
})
