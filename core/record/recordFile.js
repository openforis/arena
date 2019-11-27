import * as R from 'ramda'

import {truncate} from '@core/stringUtils'

const getProp = prop => R.path(['props', prop])

const keys = {
  props: 'props',
  content: 'content',
}

export const propKeys = {
  name: 'name',
  size: 'size',
  recordUuid: 'recordUuid',
  nodeUuid: 'nodeUuid',
}

export const createFile = (
  uuid,
  fileName,
  fileSize,
  content,
  recordUuid,
  nodeUuid,
) => ({
  uuid,
  [keys.props]: {
    [propKeys.name]: fileName,
    [propKeys.size]: fileSize,
    [propKeys.recordUuid]: recordUuid,
    [propKeys.nodeUuid]: nodeUuid,
  },
  [keys.content]: content,
})

const getExtension = fileName => R.pipe(R.split('.'), R.tail)(fileName)

export const truncateFileName = (fileName, maxLength = 10) => {
  if (fileName && !R.isEmpty(fileName)) {
    const extension = getExtension(fileName)

    return R.pipe(
      R.dropLast(extension.length + 1),
      truncate(maxLength),
      name => name + '.' + extension,
    )(fileName)
  }

  return ''
}

// READ
export const getName = getProp(propKeys.name)
export const getSize = getProp(propKeys.size)
export const getContent = R.prop(keys.content)
