import * as ActionTypes from './actionTypes'

export const surveyTaxonomyDeleted = (taxonomyUuid) => ({ type: ActionTypes.surveyTaxonomyDelete, taxonomyUuid })

export const surveyTaxonomyInserted = (taxonomy) => ({ type: ActionTypes.surveyTaxonomyInsert, taxonomy })

export const surveyTaxonomyUpdated = (taxonomy) => ({ type: ActionTypes.surveyTaxonomyUpdate, taxonomy })
