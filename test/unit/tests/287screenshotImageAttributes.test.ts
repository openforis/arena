import * as NodeDef from '@core/survey/nodeDef'

import {
  filterImageAttributeDefs,
  toImageAttributeOptions,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotImageAttributes'

const plotDef = { uuid: 'plot-def' }

const newAttributeDef = ({
  name,
  type = NodeDef.nodeDefType.file,
  cycles = ['0'],
  props = {},
  analysis = false,
}: {
  name: string
  type?: string
  cycles?: string[]
  props?: Record<string, unknown>
  analysis?: boolean
}) =>
  NodeDef.newNodeDef(
    plotDef,
    type,
    cycles,
    { name, labels: { en: `${name} label` }, fileType: NodeDef.fileTypeValues.image, ...props },
    {},
    analysis
  )

describe('Screenshot image attributes (287)', () => {
  const photo = newAttributeDef({ name: 'photo' })
  const photos = newAttributeDef({ name: 'photos', props: { multiple: true, maxFileSize: 2 } })
  const document = newAttributeDef({ name: 'document', props: { fileType: NodeDef.fileTypeValues.other } })
  const text = newAttributeDef({ name: 'notes', type: NodeDef.nodeDefType.text })
  const readOnly = newAttributeDef({ name: 'locked', props: { readOnly: true } })
  const analysis = newAttributeDef({ name: 'computed', analysis: true })
  const otherCycle = newAttributeDef({ name: 'old_photo', cycles: ['1'] })

  test('keeps only editable image file attributes of the cycle', () => {
    const kept = filterImageAttributeDefs([photo, photos, document, text, readOnly, analysis, otherCycle], '0')
    expect(kept.map((def) => NodeDef.getName(def))).toEqual(['photo', 'photos'])
  })

  test('turns the attributes into options with label, multiplicity, parent and max file size', () => {
    expect(toImageAttributeOptions([photo, photos], 'en')).toEqual([
      {
        uuid: NodeDef.getUuid(photo),
        parentUuid: 'plot-def',
        label: 'photo label',
        multiple: false,
        maxFileSizeMb: 10,
        rowParentDefUuid: null,
      },
      {
        uuid: NodeDef.getUuid(photos),
        parentUuid: 'plot-def',
        label: 'photos label',
        multiple: true,
        maxFileSizeMb: 2,
        rowParentDefUuid: null,
      },
    ])
  })

  test('labels the attributes of a multiple entity with the entity and points to the parent of the new row', () => {
    const rowEntityDef = NodeDef.newNodeDef(plotDef, NodeDef.nodeDefType.entity, ['0'], {
      name: 'plot_photos',
      labels: { en: 'Plot photos' },
      multiple: true,
    })
    const [option] = toImageAttributeOptions([photo], 'en', rowEntityDef)
    expect(option).toMatchObject({ label: 'Plot photos › photo label', rowParentDefUuid: 'plot-def' })
  })
})
