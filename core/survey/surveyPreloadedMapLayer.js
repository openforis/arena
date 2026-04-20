import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid'

const keys = {
  fileName: 'fileName',
  fileSize: 'fileSize',
  fileUuid: 'fileUuid',
  labels: 'labels',
  uuid: 'uuid',
}

const { getUuid } = ObjectUtils

const getFileName = A.prop(keys.fileName)
const getFileSize = A.prop(keys.fileSize)
const getFileUuid = A.prop(keys.fileUuid)
const getLabels = A.prop(keys.labels)
const getLabel = (lang, defaultTo = null) => A.pipe(getLabels, A.propOr(defaultTo, lang))

const newInstance = ({ fileName, fileSize, labels }) => {
  return {
    [keys.fileName]: fileName,
    [keys.fileSize]: fileSize,
    [keys.fileUuid]: uuidv4(),
    [keys.labels]: labels,
    [keys.uuid]: uuidv4(),
  }
}

export const SurveyPreloadedMapLayer = {
  keys,
  getFileName,
  getFileSize,
  getFileUuid,
  getLabels,
  getLabel,
  getUuid,
  newInstance,
}
