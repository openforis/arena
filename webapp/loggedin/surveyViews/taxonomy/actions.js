import axios from 'axios'

import { debounceAction } from '@webapp/utils/reduxUtils'
import * as Taxonomy from '@core/survey/taxonomy'
import * as NodeDef from '@core/survey/nodeDef'

import { SurveyState, TaxonomiesActions } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import * as NodeDefStorage from '@webapp/views/App/views/NodeDef/NodeDefEdit/store/storage'
import * as NodeDefState from '@webapp/views/App/views/NodeDef/NodeDefEdit/store/state'

// Taxonomy editor actions
export const taxonomyViewTaxonomyUpdate = 'taxonomyView/taxonomy/update'
export const taxonomyViewTaxonomyPropsUpdate = 'taxonomyView/taxonomy/props/update'

// ====== SET TAXONOMY FOR EDIT

export const setTaxonomyForEdit = (taxonomyUuid) => (dispatch) =>
  dispatch({ type: taxonomyViewTaxonomyUpdate, taxonomyUuid })

// ====== CREATE

export const createTaxonomy = (history, nodeDefState) => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const {
    data: { taxonomy },
  } = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

  dispatch({ type: TaxonomiesActions.taxonomyCreate, taxonomy })

  const taxonomyUuid = Taxonomy.getUuid(taxonomy)
  if (nodeDefState) {
    // update and save node def state to local storage
    const nodeDefStateUpdated = NodeDefState.assocNodeDefProp(NodeDef.propKeys.taxonomyUuid, taxonomyUuid)(nodeDefState)
    NodeDefStorage.setNodeDefState(nodeDefStateUpdated)
  }
  history.push(`${appModuleUri(designerModules.taxonomy)}${taxonomyUuid}/`)

  return taxonomy
}

// ====== READ

const fetchTaxonomy = (taxonomyUuid) => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const {
    data: { taxonomy },
  } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}?draft=true&validate=true`)

  dispatch({ type: TaxonomiesActions.taxonomyUpdate, taxonomy })
}

// ====== UPDATE
export const putTaxonomyProp = (taxonomy, key, value) => async (dispatch, getState) => {
  dispatch({ type: TaxonomiesActions.taxonomyPropUpdate, taxonomy, key, value })

  const action = async () => {
    const surveyId = SurveyState.getSurveyId(getState())
    const { data } = await axios.put(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}`, { key, value })
    dispatch({ type: TaxonomiesActions.taxonomiesUpdate, taxonomies: data.taxonomies })
  }

  dispatch(debounceAction(action, `${TaxonomiesActions.taxonomyPropUpdate}_${Taxonomy.getUuid(taxonomy)}`))
}

export const uploadTaxonomyFile = (taxonomy, file) => async (dispatch, getState) => {
  const formData = new FormData()
  formData.append('file', file)

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.post(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/upload`, formData)

  dispatch(
    JobActions.showJobMonitor({
      job: data.job,
      onComplete: () => {
        // On import complete validate taxonomy and reload taxa
        dispatch(fetchTaxonomy(Taxonomy.getUuid(taxonomy)))
      },
    })
  )
}

// ====== DELETE
export const deleteTaxonomy = (taxonomy) => async (dispatch, getState) => {
  dispatch({ type: TaxonomiesActions.taxonomyDelete, taxonomy })

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.delete(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}`)
  dispatch({ type: TaxonomiesActions.taxonomiesUpdate, taxonomies: data.taxonomies })
}

// ======
// ====== MANAGER
// ======

export const navigateToTaxonomiesManager = ({ history, nodeDefState }) => () => {
  if (nodeDefState) {
    NodeDefStorage.setNodeDefState(nodeDefState)
  }
  history.push(appModuleUri(designerModules.taxonomies))
}
