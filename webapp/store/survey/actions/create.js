import * as ActionTypes from './actionTypes'

export const createSurvey = ({ survey }) => (dispatch) => {
  dispatch({ type: ActionTypes.surveyCreate, survey })
}
