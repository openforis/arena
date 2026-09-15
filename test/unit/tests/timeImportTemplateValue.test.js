import { getTimeTemplateValue } from '@server/modules/dataImport/service/dataImportTemplateService'

describe('getTimeTemplateValue', () => {
  it('returns an HH:mm value when includeSeconds is not set', () => {
    const nodeDef = { props: {} }
    const value = getTimeTemplateValue({ nodeDef })
    expect(value).toMatch(/^\d{2}:\d{2}$/)
  })

  it('returns an HH:mm:ss value when includeSeconds is true', () => {
    const nodeDef = { props: { includeSeconds: true } }
    const value = getTimeTemplateValue({ nodeDef })
    expect(value).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })
})
