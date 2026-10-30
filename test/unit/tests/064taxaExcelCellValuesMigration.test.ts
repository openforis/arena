import { migrateTaxaExcelCellValues } from '@server/modules/taxonomy/manager/taxaExcelCellValuesMigration'

const surveyId = 1
const richText = { richText: [{ text: 'Ulmus ' }, { font: { italic: true }, text: 'minor' }] }

const newFakeClient = ({ taxa, scientificNameInUse = false }: { taxa: any[]; scientificNameInUse?: boolean }) => {
  const updates: any[] = []
  return {
    updates,
    any: async () => taxa,
    one: async (_query: string, _params: any[], transform: (row: any) => boolean) =>
      transform({ exists: scientificNameInUse }),
    none: async (_query: string, [uuid, props, propsDraft]: any[]) => {
      updates.push({ uuid, props, propsDraft })
    },
  }
}

const taxonRow = (props: any, propsDraft: any = {}) => ({
  uuid: 'taxon-uuid',
  taxonomy_uuid: 'taxonomy-uuid',
  props,
  props_draft: propsDraft,
})

describe('migrateTaxaExcelCellValues', () => {
  test('replaces formula and rich text objects with plain values, keeping the other props', async () => {
    const client = newFakeClient({
      taxa: [
        taxonRow({
          code: 'Um',
          index: 3,
          genus: { result: 'Ulmus', sharedFormula: 'C3' },
          family: { formula: 'A1', result: 'Ulmaceae', ref: 'A1:A2', shareType: 'shared' },
          scientificName: richText,
          extra: { grow_form: 'tree', height: { formula: 'B1', result: 10 } },
        }),
      ],
    })

    await migrateTaxaExcelCellValues({ surveyId }, client)

    expect(client.updates).toEqual([
      {
        uuid: 'taxon-uuid',
        props: {
          code: 'Um',
          index: 3,
          genus: 'Ulmus',
          family: 'Ulmaceae',
          scientificName: 'Ulmus minor',
          extra: { grow_form: 'tree', height: 10 },
        },
        propsDraft: {},
      },
    ])
  })

  test('converts the draft props too', async () => {
    const client = newFakeClient({ taxa: [taxonRow({}, { code: 'Um', genus: { formula: 'A1', result: 'Ulmus' } })] })

    await migrateTaxaExcelCellValues({ surveyId }, client)

    expect(client.updates[0].propsDraft).toEqual({ code: 'Um', genus: 'Ulmus' })
  })

  test('keeps the scientific name unique, using the code, when the plain value is already in use', async () => {
    const client = newFakeClient({
      taxa: [taxonRow({ code: 'Um', scientificName: richText })],
      scientificNameInUse: true,
    })

    await migrateTaxaExcelCellValues({ surveyId }, client)

    expect(client.updates[0].props.scientificName).toBe('Ulmus minor (Um)')
  })

  test('does not rename a taxon when its scientific name was already a plain value', async () => {
    const client = newFakeClient({
      taxa: [taxonRow({ code: 'Ug', scientificName: 'Ulmus glabra', genus: { formula: 'A1', result: 'Ulmus' } })],
      scientificNameInUse: true,
    })

    await migrateTaxaExcelCellValues({ surveyId }, client)

    expect(client.updates[0].props).toEqual({ code: 'Ug', scientificName: 'Ulmus glabra', genus: 'Ulmus' })
  })
})
