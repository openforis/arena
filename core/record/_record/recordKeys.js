import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  cycle: ObjectUtils.keys.cycle,
  dateCreated: ObjectUtils.keys.dateCreated,
  dateModified: ObjectUtils.keys.dateModified,
  info: 'info',
  mergedIntoRecordUuid: 'mergedIntoRecordUuid',
  nodes: 'nodes',
  ownerEmail: 'ownerEmail',
  ownerName: 'ownerName',
  ownerRole: 'ownerRole',
  ownerUuid: 'ownerUuid',
  preview: 'preview',
  step: 'step',
  surveyUuid: 'surveyUuid',
  uuid: ObjectUtils.keys.uuid,

  // record summary
  filesCount: 'filesCount',
  filesSize: 'filesSize',
  filesMissing: 'filesMissing',
  // record of a user group the current user can only read (see UserGroup readableGroupUuids)
  readOnly: 'readOnly',

  // temporary properties
  keysObj: 'keysObj',
  summaryAttributesObj: 'summaryAttributesObj',
}

export const infoKeys = {
  createdWith: 'createdWith',
  modifiedWith: 'modifiedWith',
}
