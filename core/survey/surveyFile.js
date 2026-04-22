import * as R from 'ramda'

import { FileNames } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import { truncate } from '@core/stringUtils'
import { uuidv4 } from '@core/uuid'

import * as Node from '../record/node'

const keys = {
  content: 'content',
  props: ObjectUtils.keys.props,
  uuid: ObjectUtils.keys.uuid,
  dateCreated: ObjectUtils.keys.dateCreated,
}

export const propKeys = {
  deleted: 'deleted',
  labels: 'labels',
  name: 'name',
  nodeUuid: 'nodeUuid',
  recordUuid: 'recordUuid',
  size: 'size',
  temporary: 'temporary',
  type: 'type',
}

export const invalidPropKeys = {
  fileName: 'fileName',
  fileSize: 'fileSize',
}

export const SurveyFileType = {
  preloadedMapLayer: 'preloadedMapLayer',
  recordAttachment: 'recordAttachment',
}

export const createFile = ({
  name,
  labels = null,
  uuid = null,
  size = null,
  content = null,
  recordUuid = null,
  nodeUuid = null,
  type = null,
  temporary = false,
}) => {
  const props = ObjectUtils.keepNonEmptyProps({
    [propKeys.labels]: labels,
    [propKeys.name]: name,
    [propKeys.nodeUuid]: nodeUuid,
    [propKeys.recordUuid]: recordUuid,
    [propKeys.size]: size,
    [propKeys.type]: type,
  })
  if (temporary) {
    props[propKeys.temporary] = true
  }
  return {
    [keys.uuid]: uuid ?? uuidv4(),
    [keys.props]: props,
    [keys.content]: content,
    [keys.dateCreated]: new Date().toISOString(),
  }
}

export const createFileFromNode = ({ node, size = null, content = null }) =>
  createFile({
    uuid: Node.getFileUuid(node),
    name: Node.getFileName(node),
    recordUuid: Node.getRecordUuid(node),
    nodeUuid: Node.getUuid(node),
    size,
    content,
    type: SurveyFileType.recordAttachment,
  })

export const truncateFileName = (fileName, maxLength = 10) => {
  if (fileName && !R.isEmpty(fileName)) {
    const extension = FileNames.getExtension(fileName)
    return R.pipe(R.dropLast(extension.length + 1), truncate(maxLength), (name) => `${name}.${extension}`)(fileName)
  }

  return ''
}

// READ
export const { getDateCreated, getLabel, getLabels, getProps, getUuid } = ObjectUtils
export const isDeleted = (file) => Boolean(ObjectUtils.getProp(propKeys.deleted, false)(file))
export const isTemporary = (file) => Boolean(ObjectUtils.getProp(propKeys.temporary, false)(file))
export const getName = ObjectUtils.getProp(propKeys.name)
export const getSize = ObjectUtils.getProp(propKeys.size)
export const getNodeUuid = ObjectUtils.getProp(propKeys.nodeUuid)
export const getRecordUuid = ObjectUtils.getProp(propKeys.recordUuid)
export const getContent = R.prop(keys.content)
export const getExtension = R.pipe(getName, FileNames.getExtension)
export const getType = ObjectUtils.getProp(propKeys.type, SurveyFileType.recordAttachment)

// UPDATE
export const { assocLabels } = ObjectUtils
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
    ...ObjectUtils.keepNonEmptyProps({
      [propKeys.recordUuid]: props[propKeys.recordUuid],
      [propKeys.nodeUuid]: props[propKeys.nodeUuid],
      [propKeys.labels]: props[propKeys.labels],
    }),
  }
  if (props.deleted) {
    propsUpdated[propKeys.deleted] = true
  }
  return assocProps(propsUpdated)(file)
}
