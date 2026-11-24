import type { ArenaAnyNodeDef } from '@openforis/arena-core'
import { getTimeTemplateValue } from '@server/modules/dataImport/service/dataImportTemplateService'

describe('getTimeTemplateValue', () => {
  it('returns an HH:mm value when includeSeconds is not set', () => {
    const nodeDef = { props: {} } as unknown as ArenaAnyNodeDef
    const value = getTimeTemplateValue({ nodeDef })
    expect(value).toMatch(/^\d{2}:\d{2}$/)
  })

  it('returns an HH:mm:ss value when includeSeconds is true', () => {
    const nodeDef = { props: { includeSeconds: true } } as unknown as ArenaAnyNodeDef
    const value = getTimeTemplateValue({ nodeDef })
    expect(value).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })
})
