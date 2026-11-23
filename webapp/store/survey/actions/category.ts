import * as ActionTypes from './actionTypes'

export const surveyCategoryDeleted = (categoryUuid) => ({ type: ActionTypes.surveyCategoryDelete, categoryUuid })

export const surveyCategoryInserted = (category) => ({ type: ActionTypes.surveyCategoryInsert, category })

export const surveyCategoryUpdated = (category) => ({ type: ActionTypes.surveyCategoryUpdate, category })
