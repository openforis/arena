import { uuidv4 } from '../../../core/uuid'

import * as TempFileManager from '../../../server/modules/file/manager/tempFileManager'
import * as FileUtils from '../../../server/utils/file/fileUtils'

describe('TempFileManager pending import file validation', () => {
  test('getKeptFilePath rejects an invalid fileId before touching storage', async () => {
    await expect(TempFileManager.getKeptFilePath({ fileId: 'not-a-uuid' })).rejects.toThrow('Invalid file id')
  })

  test('keepFileForLaterUse rejects an invalid fileId before touching storage', async () => {
    await expect(TempFileManager.keepFileForLaterUse({ fileId: 'not-a-uuid', filePath: '/tmp/x' })).rejects.toThrow(
      'Invalid file id'
    )
  })

  test('getKeptFilePath throws a SystemError for a valid but unknown fileId', async () => {
    await expect(TempFileManager.getKeptFilePath({ fileId: '11111111-1111-4111-8111-111111111111' })).rejects.toThrow()
  })

  test('deletePendingImportFileIfAny is a no-op for a fileId that was never kept', async () => {
    await expect(
      TempFileManager.deletePendingImportFileIfAny({ fileId: '22222222-2222-4222-8222-222222222222' })
    ).resolves.toBeUndefined()
  })

  test('keepFileForLaterUse then deletePendingImportFileIfAny actually removes the kept file', async () => {
    const fileId = uuidv4()
    await FileUtils.mkdir(FileUtils.tempFilePath(''))
    const sourceFilePath = FileUtils.newTempFilePath()
    await FileUtils.writeFile(sourceFilePath, 'pending import file content')

    await TempFileManager.keepFileForLaterUse({ fileId, filePath: sourceFilePath })

    // the kept file can be found right after being kept
    const keptFilePath = await TempFileManager.getKeptFilePath({ fileId })
    expect(FileUtils.exists(keptFilePath)).toBe(true)

    await TempFileManager.deletePendingImportFileIfAny({ fileId })

    // the kept file is really gone now, not just a local copy that leaked
    await expect(TempFileManager.getKeptFilePath({ fileId })).rejects.toThrow()
  })
})
