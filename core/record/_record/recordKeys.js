import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  cycle: ObjectUtils.keys.cycle,
  dateCreated: ObjectUtils.keys.dateCreated,
  dateModified: ObjectUtils.keys.dateModified,
  info: 'info',
  nodes: 'nodes',
  ownerName: 'ownerName',
  ownerUuid: 'ownerUuid',
  preview: 'preview',
  step: 'step',
  surveyUuid: 'surveyUuid',
  uuid: ObjectUtils.keys.uuid,

  // record summary
  filesCount: 'filesCount',
  filesSize: 'filesSize',
  filesMissing: 'filesMissing',
}

export const infoKeys = {
  createdWith: 'createdWith',
  modifiedWith: 'modifiedWith',
}
