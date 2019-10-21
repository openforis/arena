import * as R from 'ramda';
import ObjectUtils from '../../objectUtils';
import keys, { IUser } from './userKeys';
import { SurveyId, SurveyCycleKey } from '../../survey/_survey/surveyInfo';

const keysPrefs = {
  surveys: 'surveys',
  current: 'current',
  cycle: ObjectUtils.keys.cycle,
}

const pathSurveyCurrent = [keys.prefs, keysPrefs.surveys, keysPrefs.current]
const pathSurveyCycle = (surveyId: SurveyId) => [keys.prefs, keysPrefs.surveys, String(surveyId), keysPrefs.cycle]

//====== READ
const getPrefSurveyCurrent: (user: IUser) => any = R.path(pathSurveyCurrent)

const getPrefSurveyCycle: (surveyId: SurveyId) => any
= surveyId => R.path(pathSurveyCycle(surveyId)) as any

const getPrefSurveyCurrentCycle = (user: IUser) => R.pipe(
  getPrefSurveyCurrent,
  surveyId => getPrefSurveyCycle(surveyId)(user)
)(user)

//====== UPDATE
const assocPrefSurveyCurrent = (surveyId: SurveyId | null) => R.assocPath(pathSurveyCurrent, surveyId)

const assocPrefSurveyCycle = (surveyId: SurveyId, cycle: SurveyCycleKey) => R.assocPath(pathSurveyCycle(surveyId), cycle)

const assocPrefSurveyCurrentAndCycle = (surveyId: SurveyId, cycle: SurveyCycleKey) => R.pipe(
  assocPrefSurveyCurrent(surveyId),
  assocPrefSurveyCycle(surveyId, cycle)
)

//====== DELETE
const deletePrefSurvey = (surveyId: SurveyId) => (user: IUser) => {
  const surveyIdPref = getPrefSurveyCurrent(user)
  return R.pipe(
    R.when(
      R.always(String(surveyIdPref) === String(surveyId)),
      assocPrefSurveyCurrent(null)
    ),
    R.dissocPath([keys.prefs, keysPrefs.surveys, String(surveyId)])
  )(user)
}

export default {
  keysPrefs,

  //READ
  getPrefSurveyCurrent,
  getPrefSurveyCycle,
  getPrefSurveyCurrentCycle,

  //UPDATE
  assocPrefSurveyCurrent,
  assocPrefSurveyCycle,
  assocPrefSurveyCurrentAndCycle,

  //DELETE
  deletePrefSurvey,
};
