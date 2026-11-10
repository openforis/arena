import * as ProcessUtils from '@core/processUtils'
import { uuidv4 } from '@core/uuid'

import * as TempFileManager from '@server/modules/file/manager/tempFileManager'
import { processChunkedFileForBackgroundMerge } from '@server/modules/file/service/requestChunkedFileProcessor'
import { getChunkFileName } from '@server/modules/file/tempFileUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

// first of two chunks of a chunked upload
const newChunkRequest = (fileId: string) => ({
  body: {
    fileId,
    file: Buffer.from('chunk content').toString('base64'),
    chunk: '1',
    totalChunks: '2',
    totalFileSize: '26',
  },
})

const invalidFileIds = ['', 'not-a-uuid', '../outside-temp-folder', `${uuidv4()}/../other`]

describe('Chunked upload file id', () => {
  test.each(invalidFileIds)('upload request with file id "%s" is rejected with status 400', async (fileId) => {
    await expect(processChunkedFileForBackgroundMerge({ req: newChunkRequest(fileId) })).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  test('upload request with a uuid file id is accepted', async () => {
    // the temp folder is created on server startup
    await FileUtils.mkdir(ProcessUtils.ENV.tempFolder)
    const fileId = uuidv4()

    // more chunks to come: nothing returned yet
    await expect(processChunkedFileForBackgroundMerge({ req: newChunkRequest(fileId) })).resolves.toBeNull()

    await FileUtils.deleteFileAsync(FileUtils.tempFilePath(getChunkFileName({ fileId, chunk: 1 })))
  })

  test.each(invalidFileIds)('temp chunks with file id "%s" are not written or merged', async (fileId) => {
    await expect(
      TempFileManager.writeChunkToTempFile({ fileId, chunk: 1, fileContent: Buffer.from('chunk content') })
    ).rejects.toThrow('Invalid file id')
    await expect(TempFileManager.mergeTempChunks({ fileId, totalChunks: 1 })).rejects.toThrow('Invalid file id')
  })
})
