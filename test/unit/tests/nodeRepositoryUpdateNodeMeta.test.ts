import pgPromise from 'pg-promise'

import { updateNode } from '@server/modules/record/repository/nodeRepository'

const pgp = pgPromise()

describe('nodeRepository.updateNode', () => {
  it('deletes the meta items having the default value instead of storing them', async () => {
    const queries: string[] = []
    // fake client formatting the query with the real pg-promise engine (no DB in unit tests)
    const client: any = {
      query: async (query: string, params: unknown[]) => queries.push(pgp.as.format(query, params)),
    }

    const meta = { hCode: [], defaultValueApplied: false, qualifierValueApplied: true }
    await updateNode({ surveyId: 1, nodeUuid: 'node-uuid', value: 'a', meta, draft: false, reloadNode: false }, client)

    const query = queries[0].replaceAll(/\s+/g, ' ')
    expect(query).toContain(
      `meta = (meta - array['hCode','defaultValueApplied']::text[]) || '{"qualifierValueApplied":true}'::jsonb`
    )
  })

  it('does not delete any meta item when no meta is specified', async () => {
    const queries: string[] = []
    const client: any = {
      query: async (query: string, params: unknown[]) => queries.push(pgp.as.format(query, params)),
    }

    await updateNode(
      { surveyId: 1, nodeUuid: 'node-uuid', value: 'a', meta: null as any, draft: false, reloadNode: false },
      client
    )

    expect(queries[0].replaceAll(/\s+/g, ' ')).toContain(`meta = (meta - '{}'::text[]) || '{}'::jsonb`)
  })
})
