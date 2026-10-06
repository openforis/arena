import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Survey from '@core/survey/survey'

import * as FileRepository from '@server/modules/record/repository/fileRepository'
import * as RecordFileManager from '@server/modules/record/manager/recordFileManager'

export type FileToRemove = { fileUuid: string; recordUuid: string }

const _isFileAttribute = ({ survey, node }: { survey: any; node: any }): boolean =>
  NodeDef.isFile(Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey))

// the value of a node deleted because it became not applicable is cleared before the deletion: use the stored one
const _getFileUuidToRemove = ({ record, node }: { record: any; node: any }): string | null => {
  const nodeStored = Record.getNodeByUuid(Node.getUuid(node))(record)
  const fileUuidStored = nodeStored ? Node.getFileUuid(nodeStored) : null
  const fileUuid = Node.getFileUuid(node)
  if (Node.isDeleted(node)) return fileUuidStored ?? fileUuid ?? null
  // updated node with a different (or cleared) file: the stored one is not referenced anymore
  return Node.isUpdated(node) && fileUuidStored && fileUuidStored !== fileUuid ? fileUuidStored : null
}

/**
 * Finds the files that are not referenced anymore by the nodes updated or deleted by a dependents update:
 * the files of the file attributes cleared because not applicable and the ones of the deleted nodes.
 * @param {!object} params - The parameters.
 * @param {!object} params.survey - The survey.
 * @param {!object} params.record - The record, as it was before the update.
 * @param {!object[]} params.nodes - The nodes updated by the dependents update (including the deleted ones).
 * @returns {FileToRemove[]} - The files to remove.
 */
export const findFilesToRemove = ({
  survey,
  record,
  nodes,
}: {
  survey: any
  record: any
  nodes: any[]
}): FileToRemove[] => {
  const files: FileToRemove[] = []
  for (const node of nodes) {
    if (_isFileAttribute({ survey, node })) {
      const fileUuid = _getFileUuidToRemove({ record, node })
      if (fileUuid) {
        files.push({ fileUuid, recordUuid: Node.getRecordUuid(node) })
      }
    }
  }
  return files
}

/**
 * Removes the given files.
 * Normal records: the files are marked as deleted, as when the user changes the value of a file attribute
 * (soft-deleted files are never purged, their content is kept in the storage).
 * Preview records: the files are deleted immediately, content (file system or S3 bucket) and DB row.
 * @param {!object} params - The parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!FileToRemove[]} params.files - The files to remove.
 * @param {boolean} [params.isPreview] - True if the files belong to a preview record.
 * @param {object} tx - The database transaction.
 * @returns {Promise<void>} - The result promise.
 */
export const removeFiles = async (
  { surveyId, files, isPreview = false }: { surveyId: number; files: FileToRemove[]; isPreview?: boolean },
  tx: any
): Promise<void> => {
  if (files.length === 0) return

  if (isPreview) {
    await RecordFileManager.deleteFiles({ surveyId, files }, tx)
    return
  }
  await FileRepository.markFilesAsDeleted(
    surveyId,
    files.map(({ fileUuid }) => fileUuid),
    tx
  )
}
