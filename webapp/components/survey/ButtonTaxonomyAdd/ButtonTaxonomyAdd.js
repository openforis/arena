import axios from 'axios'

import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n } from '@webapp/store/system'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

const ButtonTaxonomyAdd = (props) => {
  const { onAdd } = props

  const i18n = useI18n()
  const dispatch = useDispatch()

  const surveyId = useSurveyId()

  const add = useCallback(async () => {
    const {
      data: { taxonomy },
    } = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

    dispatch(SurveyActions.metaUpdated())

    onAdd(taxonomy)
  }, [])

  return (
    <button type="button" onClick={add} className="btn btn-s">
      <span className="icon icon-plus icon-12px icon-left" />
      {i18n.t('common.add')}
    </button>
  )
}

ButtonTaxonomyAdd.propTypes = {
  onAdd: PropTypes.func.isRequired,
}

export default ButtonTaxonomyAdd
