import * as R from 'ramda';
import ObjectUtils from '../objectUtils';
import StringUtils from '../stringUtils';
import AuthGroups from '../auth/authGroups';
import keys from './_user/userKeys';
import UserPrefs from './_user/userPrefs';

//====== READ
const getName: (x: any) => string = R.propOr('', keys.name)
const getEmail: (x: any) => string = R.prop(keys.email)
const getLang: (x: any) => string = R.propOr('en', keys.lang)
const getAuthGroups: (x: any) => any[] = R.prop(keys.authGroups)
const getPrefs: (x: any) => string = R.propOr({}, keys.prefs)
const hasProfilePicture: (x: any) => boolean = R.propEq(keys.hasProfilePicture, true)

//====== CHECK
const isSystemAdmin: (user: any) => boolean
= user => user && R.any(AuthGroups.isSystemAdminGroup)(getAuthGroups(user))

const hasAccepted = R.pipe(getName, StringUtils.isNotBlank)

//====== AUTH GROUP
const assocAuthGroup = <T>(authGroup: T) => (user: any) => {
  const authGroups = R.pipe(getAuthGroups, R.append(authGroup))(user)
  return R.assoc(keys.authGroups, authGroups, user)
}

const dissocAuthGroup = authGroup => user => {
  const authGroups = R.pipe(
    getAuthGroups,
    R.reject(R.propEq(AuthGroups.keys.uuid, AuthGroups.getUuid(authGroup))),
  )(user)
  return R.assoc(keys.authGroups, authGroups, user)
}

export const getUuid = ObjectUtils.getUuid

export default {
  keys,
  keysPrefs: UserPrefs.keysPrefs,

  // READ
  isEqual: ObjectUtils.isEqual,
  getUuid: ObjectUtils.getUuid,
  getName,
  getEmail,
  getLang,
  getAuthGroups,
  getPrefs,
  hasProfilePicture,

  //CHECK
  isSystemAdmin,
  hasAccepted,

  //AUTH GROUP
  assocAuthGroup,
  dissocAuthGroup,

  //PREFS
  getPrefSurveyCurrent: UserPrefs.getPrefSurveyCurrent,
  getPrefSurveyCycle: UserPrefs.getPrefSurveyCycle,
  getPrefSurveyCurrentCycle: UserPrefs.getPrefSurveyCurrentCycle,

  assocPrefSurveyCurrent: UserPrefs.assocPrefSurveyCurrent,
  assocPrefSurveyCycle: UserPrefs.assocPrefSurveyCycle,
  assocPrefSurveyCurrentAndCycle: UserPrefs.assocPrefSurveyCurrentAndCycle,

  deletePrefSurvey: UserPrefs.deletePrefSurvey,
};
