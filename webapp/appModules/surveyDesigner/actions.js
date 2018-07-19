import { appState } from '../../app/app'
import { newEntityDef, newPageDef } from './components/formDesigner'

export const addRootEntity = () =>
  (dispatch, getState) => {

    const surveyId = appState.getSurveyId(getState())

    const pageDef = newPageDef()
    const entityDef = newEntityDef()

  }

const addEntityPage = (entityId) =>
  (dispatch, getState) => {
    const surveyId = appState.getSurveyId(getState())

    const pageDef = newPageDef()

  }
