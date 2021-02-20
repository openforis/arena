import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as API from '@webapp/service/api'

import { useI18n } from '@webapp/store/system'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

export const metaItemTypes = {
  taxonomy: 'taxonomy',
  category: 'category',
}

const creatorsByType = {
  [metaItemTypes.taxonomy]: API.createTaxonomy,
  [metaItemTypes.category]: API.createCategory,
}

const ButtonMetaItemAdd = (props) => {
  const { id, onAdd, metaItemType } = props

  const i18n = useI18n()
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  const add = useCallback(async () => {
    if (creatorsByType[metaItemType]) {
      const item = await creatorsByType[metaItemType]({ surveyId })
      dispatch(SurveyActions.metaUpdated())
      onAdd(item)
    }
  }, [])

  return (
    <button id={id} type="button" onClick={add} className={`btn btn-s btn-add-${metaItemType}`}>
      <span className="icon icon-plus icon-12px icon-left" />
      {i18n.t('common.add')}
    </button>
  )
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
