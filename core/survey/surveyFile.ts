import { ArenaRecordNode, FileNames } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import { truncate } from '@core/stringUtils'
import { uuidv4 } from '@core/uuid'
import * as Node from '../record/node'

import { cycleOneKey } from './_survey/surveyInfo'

export const keys = {
  content: 'content',
  props: ObjectUtils.keys.props,
  uuid: ObjectUtils.keys.uuid,
  dateCreated: ObjectUtils.keys.dateCreated,
}

export const propKeys = {
  chainUuid: 'chainUuid',
  cycle: 'cycle',
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

export interface SurveyFileProps {
  chainUuid?: string
  cycle?: string
  deleted?: boolean
  labels?: Record<string, string>
  name?: string
  nodeUuid?: string
  recordUuid?: string
  size?: number
  temporary?: boolean
  type?: string
  [key: string]: unknown
}

export interface SurveyFile {
  uuid: string
  props: SurveyFileProps
  content?: Buffer | null
  dateCreated?: string
}

export const SurveyFileType = {
  areaOfInterest: 'areaOfInterest',
  chainMau: 'chainMau',
  preloadedMapLayer: 'preloadedMapLayer',
  printableExportPdf: 'printableExportPdf',
  recordAttachment: 'recordAttachment',
  surveyDocImage: 'surveyDocImage',
  brandingSurveyLogo1: 'brandingSurveyLogo1',
  brandingSurveyLogo2: 'brandingSurveyLogo2',
  brandingSurveyLogo3: 'brandingSurveyLogo3',
  brandingLandingBackground: 'brandingLandingBackground',
}

export const createFile = ({
  name,
  labels = null,
  uuid = null,
  size = null,
  content = null,
  chainUuid = null,
  cycle = null,
  recordUuid = null,
  nodeUuid = null,
  type = null,
  temporary = false,
}: {
  name: string
  labels?: Record<string, string> | null
  uuid?: string | null
  size?: number | null
  content?: Buffer | null
  chainUuid?: string | null
  cycle?: string | null
  recordUuid?: string | null
  nodeUuid?: string | null
  type?: string | null
  temporary?: boolean
}): SurveyFile => {
  const props: SurveyFileProps = ObjectUtils.keepNonEmptyProps({
    [propKeys.chainUuid]: chainUuid,
    [propKeys.cycle]: cycle,
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

export const createFileFromNode = ({
  node,
  size = null,
  content = null,
}: {
  node: ArenaRecordNode
  size?: number | null
  content?: Buffer | null
}): SurveyFile =>
  createFile({
    uuid: Node.getFileUuid(node),
    name: Node.getFileName(node),
    recordUuid: Node.getRecordUuid(node),
    nodeUuid: Node.getUuid(node),
    size,
    content,
    type: SurveyFileType.recordAttachment,
  })

export const truncateFileName = (fileName: string | null | undefined, maxLength = 10): string => {
  if (fileName && !A.isEmpty(fileName)) {
    const extension = FileNames.getExtension(fileName)
    return A.pipe(A.dropLast(extension.length + 1), truncate(maxLength), (name) => `${name}.${extension}`)(fileName)
  }

  return ''
}

// READ
export const { getDateCreated, getLabel, getLabels, getProps, getUuid } = ObjectUtils
export const isDeleted = (file: SurveyFile): boolean => Boolean(ObjectUtils.getProp(propKeys.deleted, false)(file))
export const isTemporary = (file: SurveyFile): boolean => Boolean(ObjectUtils.getProp(propKeys.temporary, false)(file))
type FileGetter<T> = (file: SurveyFile) => T
export const getName: FileGetter<string | null> = ObjectUtils.getProp(propKeys.name)
export const getSize: FileGetter<number | null> = ObjectUtils.getProp(propKeys.size)
export const getChainUuid: FileGetter<string | null> = ObjectUtils.getProp(propKeys.chainUuid)
export const getCycle: FileGetter<string> = ObjectUtils.getProp(propKeys.cycle, cycleOneKey)
export const getNodeUuid: FileGetter<string | null> = ObjectUtils.getProp(propKeys.nodeUuid)
export const getRecordUuid: FileGetter<string | null> = ObjectUtils.getProp(propKeys.recordUuid)
export const getContent = (file: SurveyFile): Buffer | null | undefined => A.prop(keys.content)(file)
export const getExtension = (file: SurveyFile): string => FileNames.getExtension(getName(file))
export const getType: FileGetter<string> = ObjectUtils.getProp(propKeys.type, SurveyFileType.recordAttachment)

// UPDATE
export const { assocLabels } = ObjectUtils
export const assocContent = A.assoc(keys.content)
export const assocSize = (size: number) => ObjectUtils.setProp(propKeys.size, size)

const assocProps = A.assoc(keys.props)

const hasInvalidProps = (file: SurveyFile): boolean => Object.hasOwn(getProps(file), invalidPropKeys.fileName)

export const cleanupInvalidProps = (file: SurveyFile): SurveyFile => {
  if (!hasInvalidProps(file)) {
    return file
  }
  const props = getProps(file) as SurveyFileProps

  const propsUpdated: SurveyFileProps = {
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
