import type { ArenaAnyNodeDef } from '@openforis/arena-core'
import { getTimeColumnToCharFormat } from '@server/modules/surveyRdb/repository/dataView/read'

describe('getTimeColumnToCharFormat', () => {
  it('returns HH24:MI when includeSeconds is not set', () => {
    const nodeDefCol = { props: {} } as ArenaAnyNodeDef
    expect(getTimeColumnToCharFormat(nodeDefCol)).toBe('HH24:MI')
  })

  it('returns HH24:MI:SS when includeSeconds is true', () => {
    const nodeDefCol = { props: { includeSeconds: true } } as unknown as ArenaAnyNodeDef
    expect(getTimeColumnToCharFormat(nodeDefCol)).toBe('HH24:MI:SS')
  })
})
