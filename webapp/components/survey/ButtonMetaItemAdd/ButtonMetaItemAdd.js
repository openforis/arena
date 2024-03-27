import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import { ButtonAdd } from '@webapp/components'
import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

export const metaItemTypes = {
  taxonomy: 'taxonomy',
  category: 'category',
}

const creatorsByType = {
  [metaItemTypes.taxonomy]: API.createTaxonomy,
  [metaItemTypes.category]: API.createCategory,
}

const actionsByType = {
  [metaItemTypes.taxonomy]: SurveyActions.surveyTaxonomyInserted,
  [metaItemTypes.category]: SurveyActions.surveyCategoryInserted,
}

const ButtonMetaItemAdd = (props) => {
  const { id, onAdd, metaItemType } = props

  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  const add = useCallback(async () => {
    if (creatorsByType[metaItemType]) {
      const item = await creatorsByType[metaItemType]({ surveyId })
      const action = actionsByType[metaItemType]
      dispatch(action(item))
      dispatch(SurveyActions.metaUpdated())
      onAdd(item)
    }
  }, [])

  return <ButtonAdd testId={id} onClick={add} className={`btn-add-${metaItemType}`} size="small" />
}

ButtonMetaItemAdd.propTypes = {
  id: PropTypes.string,
  onAdd: PropTypes.func.isRequired,
  metaItemType: PropTypes.string.isRequired,
}

ButtonMetaItemAdd.defaultProps = {
  id: null,
}

export default ButtonMetaItemAdd
