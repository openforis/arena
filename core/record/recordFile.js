import * as R from 'ramda'

import { truncate } from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid'
import * as Node from './node'

const keys = {
  uuid: ObjectUtils.keys.uuid,
  props: ObjectUtils.keys.props,
  content: 'content',
}

export const propKeys = {
  deleted: 'deleted',
  name: 'name',
  size: 'size',
  recordUuid: 'recordUuid',
  nodeUuid: 'nodeUuid',
}

export const invalidPropKeys = {
  fileName: 'fileName',
  fileSize: 'fileSize',
}

export const createFile = ({ name, uuid = null, size = null, content = null, recordUuid = null, nodeUuid = null }) => ({
  [keys.uuid]: uuid ?? uuidv4(),
  [keys.props]: {
    [propKeys.name]: name,
    [propKeys.size]: size,
    [propKeys.recordUuid]: recordUuid,
    [propKeys.nodeUuid]: nodeUuid,
  },
  [keys.content]: content,
})

export const createFileFromNode = ({ node, size = null, content = null }) =>
  createFile({
    uuid: Node.getFileUuid(node),
    name: Node.getFileName(node),
    recordUuid: Node.getRecordUuid(node),
    nodeUuid: Node.getUuid(node),
    size,
    content,
  })

const getExtensionFromFileName = (fileName) => R.pipe(R.split('.'), R.tail)(fileName)

export const truncateFileName = (fileName, maxLength = 10) => {
  if (fileName && !R.isEmpty(fileName)) {
    const extension = getExtensionFromFileName(fileName)

    return R.pipe(R.dropLast(extension.length + 1), truncate(maxLength), (name) => `${name}.${extension}`)(fileName)
  }

  return ''
}

// READ
export const { getUuid, getProps } = ObjectUtils
export const isDeleted = (file) => Boolean(ObjectUtils.getProp(propKeys.deleted, false)(file))
export const getName = ObjectUtils.getProp(propKeys.name)
export const getSize = ObjectUtils.getProp(propKeys.size)
export const getRecordUuid = ObjectUtils.getProp(propKeys.recordUuid)
export const getContent = R.prop(keys.content)
export const getExtension = R.pipe(getName, getExtensionFromFileName)

// UPDATE
export const assocContent = R.assoc(keys.content)
export const assocSize = (size) => ObjectUtils.setProp(propKeys.size, size)

const assocProps = R.assoc(keys.props)

const hasInvalidProps = (file) => Object.hasOwn(getProps(file), invalidPropKeys.fileName)

export const cleanupInvalidProps = (file) => {
  if (!hasInvalidProps(file)) {
    return file
  }
  const props = getProps(file)

  const propsUpdated = {
    [propKeys.name]: props[invalidPropKeys.fileName],
    [propKeys.size]: props[invalidPropKeys.fileSize],
    [propKeys.recordUuid]: props[propKeys.recordUuid],
    [propKeys.nodeUuid]: props[propKeys.nodeUuid],
  }
  if (props.deleted) {
    propsUpdated[propKeys.deleted] = true
  }
  return assocProps(propsUpdated)(file)
}
