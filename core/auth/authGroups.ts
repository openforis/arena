import * as R from 'ramda';
import ObjectUtils from '../objectUtils';

const keys = {
  uuid: 'uuid',
  authGroups: 'authGroups',
  permissions: 'permissions',
  recordSteps: 'recordSteps',
  all: 'all',
  own: 'own',
  surveyUuid: 'surveyUuid',
  name: 'name',
}

const permissions = {
  // surveys
  surveyCreate: 'surveyCreate',

  // only owner and administrator can delete survey
  // edit survey info props, edit nodeDefs, edit categories, edit taxonomies, publishSurvey
  surveyEdit: 'surveyEdit',

  // records
  recordCreate: 'recordCreate',
  recordEdit: 'recordEdit',
  recordView: 'recordView',
  recordCleanse: 'recordCleanse',
  recordAnalyse: 'recordAnalyse',

  // users
  userInvite: 'userInvite',

  // edit
  // only owner and admin - for now
  permissionsEdit: 'permissionsEdit',
}

const groupNames = {
  systemAdmin: 'systemAdmin',
  surveyAdmin: 'surveyAdmin',
  surveyEditor: 'surveyEditor',
  dataEditor: 'dataEditor',
  dataCleanser: 'dataCleanser',
  dataAnalyst: 'dataAnalyst',
  surveyGuest: 'surveyGuest',
}

const getAuthGroups: (x: any) => any[] = R.propOr([], keys.authGroups)

const getUuid: (x: any) => string = R.prop(keys.uuid)

const getName: (x: any) => string = R.prop(keys.name)

const getSurveyUuid: (x: any) => string = R.prop(keys.surveyUuid)

const isSystemAdminGroup: (x: any) => boolean = R.pipe(
  getName,
  R.equals(groupNames.systemAdmin)
)

export default {
  keys,
  permissions,
  groupNames,

  getAuthGroups,

  getUuid,
  getName,
  getSurveyUuid,
  isSystemAdminGroup,
  isEqual: ObjectUtils.isEqual,
};
