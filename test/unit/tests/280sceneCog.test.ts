/**
 * Sentinel-2 COG URLs (derived from the thumbnail) and pixel colours for each band mix.
 */
import {
  createReflectancePixelToColor,
  getScenePixelToColor,
  reflectanceToByte,
  SCENE_STRETCH_MAX,
  tciPixelToColor,
} from '@webapp/components/MapContainer/workspace/scenes/sceneColors'
import {
  getSceneCogUrls,
  getSceneDirectoryUrl,
  SCENE_BAND_MIXES,
} from '@webapp/components/MapContainer/workspace/scenes/sceneUrls'

const THUMBNAIL =
  'https://e84-earth-search-sentinel-data.s3.us-west-2.amazonaws.com/sentinel-2-c1-l2a/37/M/BU/2026/1/S2C_T37MBU_20260102T075113_L2A/L2A_PVI.jpg'
const DIRECTORY = THUMBNAIL.replace('L2A_PVI.jpg', '')

describe('Sentinel-2 COG URLs and colours (280)', () => {
  test('derives the true colour COG by replacing L2A_PVI.jpg with TCI.tif', () => {
    expect(SCENE_BAND_MIXES).toEqual(['trueColour', 'falseColourVegetation', 'swir'])
    expect(getSceneCogUrls(THUMBNAIL, 'trueColour')).toEqual([THUMBNAIL.replace('L2A_PVI.jpg', 'TCI.tif')])
  })

  test('derives three band COGs for the other mixes', () => {
    expect(getSceneCogUrls(THUMBNAIL, 'falseColourVegetation')).toEqual([
      `${DIRECTORY}B08.tif`,
      `${DIRECTORY}B04.tif`,
      `${DIRECTORY}B03.tif`,
    ])
    expect(getSceneCogUrls(THUMBNAIL, 'swir')).toEqual([
      `${DIRECTORY}B12.tif`,
      `${DIRECTORY}B8A.tif`,
      `${DIRECTORY}B04.tif`,
    ])
  })

  test('drops the query string and accepts only https on amazonaws.com', () => {
    expect(getSceneDirectoryUrl(`${THUMBNAIL}?versionId=1`)).toBe(DIRECTORY)
    expect(getSceneDirectoryUrl(THUMBNAIL.replace('https:', 'http:'))).toBeNull()
    expect(getSceneDirectoryUrl('https://evil.example.com/a/L2A_PVI.jpg')).toBeNull()
    expect(getSceneDirectoryUrl('https://amazonaws.com.evil.example/a/L2A_PVI.jpg')).toBeNull()
    expect(getSceneDirectoryUrl('not a url')).toBeNull()
    expect(getSceneDirectoryUrl('')).toBeNull()
    expect(getSceneDirectoryUrl(null)).toBeNull()
    expect(getSceneCogUrls(null, 'swir')).toBeNull()
  })

  test('colours true colour pixels and hides nodata', () => {
    expect(tciPixelToColor([0, 0, 0])).toBeNull()
    expect(tciPixelToColor([])).toBeNull()
    expect(tciPixelToColor([255, 128, 0])).toBe('#ff8000')
    expect(tciPixelToColor([10, 0, 0])).toBe('#0a0000')
    expect(tciPixelToColor([300, -5, Number.NaN])).toBe('#ff0000')
  })

  test('stretches reflectance (DN × 0.0001 − 0.1) to bytes', () => {
    expect(reflectanceToByte(1000, 0.45)).toBe(0)
    expect(reflectanceToByte(900, 0.45)).toBe(0)
    expect(reflectanceToByte(4600, 0.45)).toBe(204)
    expect(reflectanceToByte(20000, 0.45)).toBe(255)
  })

  test('colours band mixes and hides a pixel when any band is nodata', () => {
    const toColor = createReflectancePixelToColor(SCENE_STRETCH_MAX.falseColourVegetation)
    expect(toColor([4600, 1000, 3000])).toBe('#cc00ff')
    expect(toColor([4600, 0, 3000])).toBeNull()
    expect(toColor([4600, 1000])).toBeNull()
    expect(getScenePixelToColor('trueColour')).toBe(tciPixelToColor)
    expect(getScenePixelToColor('swir')([4000, 5000, 3000])).toMatch(/^#[0-9a-f]{6}$/)
  })
})
