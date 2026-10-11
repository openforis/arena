import * as Node from '@core/record/node'

import {
  buildNodePersistFields,
  buildScreenshotFileValue,
  buildScreenshotNodeChange,
  fieldsToFormData,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotNode'

const recordUuid = 'record-1'
const fileValue = buildScreenshotFileValue({
  fileUuid: 'file-new',
  fileName: 'cluster_2_2026-10-11.png',
  fileSize: 2048,
})

const root = Node.newNode('cluster-def', recordUuid)
const plot1 = Node.newNode('plot-def', recordUuid, root)
const details1 = Node.newNode('details-def', recordUuid, plot1)
const plot2 = Node.newNode('plot-def', recordUuid, root)
const details2 = Node.newNode('details-def', recordUuid, plot2)
const oldPhoto = Node.newNode(
  'photo-def',
  recordUuid,
  root,
  buildScreenshotFileValue({ fileUuid: 'file-old', fileName: 'old.png', fileSize: 10 })
)
const emptyPhoto = Node.newNode('empty-photo-def', recordUuid, root, null)
const nodes = [root, plot1, details1, plot2, details2, oldPhoto, emptyPhoto]

const baseInput = {
  nodes,
  recordUuid,
  parentUuid: Node.getUuid(root),
  entityDefUuid: 'cluster-def',
  attributeDefUuid: 'new-photo-def',
  attributeParentDefUuid: 'cluster-def',
  attributeMultiple: false,
  value: fileValue,
}

describe('Screenshot node change and form fields (288)', () => {
  test('builds the file value with the node value props', () => {
    expect(fileValue).toEqual({
      [Node.valuePropsFile.fileUuid]: 'file-new',
      [Node.valuePropsFile.fileName]: 'cluster_2_2026-10-11.png',
      [Node.valuePropsFile.fileSize]: 2048,
    })
  })

  test('creates the attribute under the plot when it has no node yet', () => {
    const change = buildScreenshotNodeChange(baseInput)
    expect(change).toMatchObject({ ok: true, kind: 'create', replacedFileName: null })
    expect(Node.getNodeDefUuid(change.node)).toBe('new-photo-def')
    expect(Node.getParentUuid(change.node)).toBe(Node.getUuid(root))
    expect(Node.getRecordUuid(change.node)).toBe(recordUuid)
    expect(Node.getFileName(change.node)).toBe('cluster_2_2026-10-11.png')
    expect(Node.isDescendantOf(root)(change.node)).toBe(true)
  })

  test('updates a single attribute and returns the name of the file it replaces', () => {
    const change = buildScreenshotNodeChange({ ...baseInput, attributeDefUuid: 'photo-def' })
    expect(change).toMatchObject({ ok: true, kind: 'update', replacedFileName: 'old.png' })
    expect(Node.getUuid(change.node)).toBe(Node.getUuid(oldPhoto))
    expect(Node.getFileUuid(change.node)).toBe('file-new')
  })

  test('updates an empty single attribute without a file to replace', () => {
    const change = buildScreenshotNodeChange({ ...baseInput, attributeDefUuid: 'empty-photo-def' })
    expect(change).toMatchObject({ ok: true, kind: 'update', replacedFileName: null })
    expect(Node.getUuid(change.node)).toBe(Node.getUuid(emptyPhoto))
  })

  test('always creates a new node for a multiple attribute', () => {
    const change = buildScreenshotNodeChange({ ...baseInput, attributeDefUuid: 'photo-def', attributeMultiple: true })
    expect(change).toMatchObject({ ok: true, kind: 'create', replacedFileName: null })
    expect(Node.getUuid(change.node)).not.toBe(Node.getUuid(oldPhoto))
  })

  test('puts the attribute in the single entity of the selected plot only', () => {
    const change = buildScreenshotNodeChange({
      ...baseInput,
      parentUuid: Node.getUuid(plot2),
      entityDefUuid: 'plot-def',
      attributeDefUuid: 'site-map-def',
      attributeParentDefUuid: 'details-def',
    })
    expect(change).toMatchObject({ ok: true, kind: 'create' })
    expect(Node.getParentUuid(change.node)).toBe(Node.getUuid(details2))
  })

  test('walks up from a nested location entity to the plot', () => {
    const change = buildScreenshotNodeChange({
      ...baseInput,
      parentUuid: Node.getUuid(details2),
      entityDefUuid: 'plot-def',
      attributeDefUuid: 'plot-photo-def',
      attributeParentDefUuid: 'plot-def',
    })
    expect(Node.getParentUuid(change.node)).toBe(Node.getUuid(plot2))
  })

  test('reports a plot or a parent entity that is not in the record', () => {
    expect(buildScreenshotNodeChange({ ...baseInput, parentUuid: 'missing' })).toEqual({
      ok: false,
      errorKey: 'plotNotFound',
    })
    expect(buildScreenshotNodeChange({ ...baseInput, attributeParentDefUuid: 'nowhere-def' })).toEqual({
      ok: false,
      errorKey: 'plotNotFound',
    })
  })

  test('builds the multipart fields of the node endpoint in order', () => {
    const file = new Blob(['png'])
    const node = { uuid: 'node-1' }
    const fields = buildNodePersistFields({
      node,
      cycle: '0',
      timezoneOffset: -120,
      lang: 'en',
      file,
      fileName: 'a.png',
    })
    expect(fields.map((field) => field.name)).toEqual(['node', 'cycle', 'draft', 'timezoneOffset', 'lang', 'file'])
    expect(JSON.parse(fields[0].value as string)).toEqual(node)
    expect(fields.slice(1, 5).map((field) => field.value)).toEqual(['0', 'false', '-120', 'en'])
    expect(fields[5]).toEqual({ name: 'file', value: file, fileName: 'a.png' })
  })

  test('appends the file with its file name', () => {
    const file = new Blob(['png'])
    const formData = { append: jest.fn() }
    fieldsToFormData(
      [
        { name: 'lang', value: 'en' },
        { name: 'file', value: file, fileName: 'a.png' },
      ],
      formData
    )
    expect(formData.append.mock.calls).toEqual([
      ['lang', 'en'],
      ['file', file, 'a.png'],
    ])
  })
})
