import { createRefDataProviders } from '@webapp/ai/tools/cleaning/refDataProviders'

import { newFakeCleaningApi } from '@test/unit/utils/aiCleaningTestUtils'

const signal = new AbortController().signal

describe('createRefDataProviders', () => {
  test('walks the code path one level at a time, matching codes exactly', async () => {
    const itemsByParent: Record<string, any[]> = {
      root: [
        { uuid: 'a', props: { code: 'A2' } },
        { uuid: 'b', props: { code: 'A' } },
      ],
      b: [{ uuid: 'c', props: { code: '1' } }],
    }
    const { api, calls } = newFakeCleaningApi({
      fetchCategoryItems: ({ parentUuid }: any) => itemsByParent[parentUuid ?? 'root'],
    })
    const { categoryItemProvider } = createRefDataProviders({ api, surveyId: 1, signal })
    const item = await categoryItemProvider.getItemByCodePaths({ categoryUuid: 'cat', codePaths: ['A', '1'] })
    expect(item.uuid).toBe('c')
    expect(calls.map((call) => [call.params.parentUuid, call.params.search, call.params.signal])).toEqual([
      [null, 'A', signal],
      ['b', '1', signal],
    ])
    // the found item is known by uuid afterwards
    expect(await categoryItemProvider.getItemByUuid({ survey: {}, itemUuid: 'c' })).toBe(item)
    expect(await categoryItemProvider.getItemByCodePaths({ categoryUuid: 'cat', codePaths: ['Z'] })).toBeNull()
  })

  test('finds a taxon by scientific name, case-insensitive and exact', async () => {
    const taxa = [
      { uuid: 't1', props: { code: 'AFZ', scientificName: 'Afzelia quanzensis subsp.' } },
      { uuid: 't2', props: { code: 'AFQ', scientificName: 'Afzelia quanzensis' } },
    ]
    const { api, calls } = newFakeCleaningApi({ findTaxa: () => taxa })
    const { taxonProvider } = createRefDataProviders({ api, surveyId: 1 })
    const taxon = await taxonProvider.findTaxonByScientificName({
      taxonomyUuid: 'tx',
      scientificName: 'afzelia QUANZENSIS',
    })
    expect(taxon.uuid).toBe('t2')
    expect(calls[0].params).toMatchObject({ filterProp: 'scientificName', filterValue: 'afzelia QUANZENSIS' })
    expect(await taxonProvider.getTaxonByUuid({ survey: {}, taxonUuid: 't2' })).toBe(taxon)
    expect(await taxonProvider.getTaxonByCode({ taxonomyUuid: 'tx', taxonCode: 'nope' })).toBeNull()
  })
})
