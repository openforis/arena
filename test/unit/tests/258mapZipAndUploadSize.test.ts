import JSZip from 'jszip'

import { isUploadTooLarge } from '@webapp/components/MapContainer/workspace/uploaded/uploadedFiles'
import { ZipUtils } from '@webapp/utils/zipUtils'

describe('Zip entries and upload size (258)', () => {
  test('forEachFileInZip skips directory entries', async () => {
    const zip = new JSZip()
    zip.folder('files')
    zip.file('doc.kml', '<kml/>')
    const content = await zip.generateAsync({ type: 'uint8array' })
    const names: string[] = []
    await ZipUtils.forEachFileInZip(content, async (name: string) => {
      names.push(name)
    })
    expect(names).toEqual(['doc.kml'])
  })

  test('isUploadTooLarge', () => {
    expect(isUploadTooLarge(50 * 1024 * 1024)).toBe(false)
    expect(isUploadTooLarge(50 * 1024 * 1024 + 1)).toBe(true)
  })
})
