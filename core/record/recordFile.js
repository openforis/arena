import * as R from 'ramda'

import { truncate } from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'

const keys = {
  uuid: ObjectUtils.keys.uuid,
  props: ObjectUtils.keys.props,
  content: 'content',
}

export const propKeys = {
  name: 'name',
  size: 'size',
  recordUuid: 'recordUuid',
  nodeUuid: 'nodeUuid',
}

export const createFile = (uuid, fileName, fileSize, content, recordUuid, nodeUuid) => ({
  [keys.uuid]: uuid,
  [keys.props]: {
    [propKeys.name]: fileName,
    [propKeys.size]: fileSize,
    [propKeys.recordUuid]: recordUuid,
    [propKeys.nodeUuid]: nodeUuid,
  },
  [keys.content]: content,
})

const getExtension = (fileName) => R.pipe(R.split('.'), R.tail)(fileName)

export const truncateFileName = (fileName, maxLength = 10) => {
  if (fileName && !R.isEmpty(fileName)) {
    const extension = getExtension(fileName)

    return R.pipe(R.dropLast(extension.length + 1), truncate(maxLength), (name) => `${name}.${extension}`)(fileName)
  }

  return ''
}

// READ
export const { getUuid } = ObjectUtils
export const getName = ObjectUtils.getProp(propKeys.name)
export const getSize = ObjectUtils.getProp(propKeys.size)
export const getContent = R.prop(keys.content)
