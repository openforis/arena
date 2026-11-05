import { getSelectableBaseLayers } from '@webapp/components/MapContainer/workspace/toolbar/baseMapItems'
import { getDisplayMenuSections } from '@webapp/components/MapContainer/workspace/toolbar/displayMenuItems'

const baseLayers = [
  { key: 'a', name: 'A' },
  { key: 'ee', name: 'EE', type: 'maplibre' },
  { key: 'p', name: 'P', apiKeyRequired: true, provider: 'planet' },
]

describe('Map menu models (255)', () => {
  test('base maps: Equal Earth only with experimental features, API-key layers only with a key', () => {
    const keys = (experimentalFeaturesEnabled: boolean, hasApiKey: (provider: string) => boolean) =>
      getSelectableBaseLayers({ baseLayers, experimentalFeaturesEnabled, hasApiKey }).map((layer) => layer.key)
    expect(keys(false, () => false)).toEqual(['a'])
    expect(keys(true, (provider) => provider === 'planet')).toEqual(['a', 'ee', 'p'])
    expect(keys(false, () => true)).toEqual(['a', 'p'])
  })

  test('display menu without image interpretation: one section, labels disabled while markers are hidden', () => {
    const sections = getDisplayMenuSections({
      options: { showLocationMarkers: false, showMarkersLabels: false },
      sampleBasedImageInterpretationEnabled: false,
    })
    expect(sections).toHaveLength(1)
    expect(sections[0].headerKey).toBeNull()
    expect(sections[0].items).toEqual([
      {
        key: 'showLocationMarkers',
        labelKey: 'mapWorkspace.display.showLocationMarkers',
        checked: false,
        disabled: false,
      },
      { key: 'showMarkersLabels', labelKey: 'mapWorkspace.display.showMarkersLabels', checked: false, disabled: true },
      { key: 'showUtmGrid', labelKey: 'mapWorkspace.display.showUtmGrid', checked: false, disabled: false },
    ])
  })

  test('display menu with image interpretation adds its section', () => {
    const sections = getDisplayMenuSections({
      options: { showLocationMarkers: true, showSamplingPolygon: true },
      sampleBasedImageInterpretationEnabled: true,
    })
    expect(sections.map((section) => section.headerKey)).toEqual([null, 'mapWorkspace.display.imageInterpretation'])
    expect(sections[0].items[1]).toMatchObject({ key: 'showMarkersLabels', disabled: false })
    expect(sections[1].items.map((item) => [item.key, item.checked])).toEqual([
      ['showSamplingPolygon', true],
      ['showControlPoints', false],
      ['showPlotReferencePoint', false],
    ])
  })
})
