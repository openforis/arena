import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { matchPath, useHistory, useLocation } from 'react-router'
import axios from 'axios'

import { useI18n } from '@webapp/store/system'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import * as A from '@core/arena'
import * as Taxonomy from '@core/survey/taxonomy'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useDispatch } from 'react-redux'

const ButtonTaxonomyAdd = (props) => {
  const i18n = useI18n()
  const { pathname } = useLocation()
  const history = useHistory()
  const dispatch = useDispatch()

  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))

  const { onTaxonomyCreated } = props

  const surveyId = useSurveyId()

  const add = useCallback(async () => {
    const {
      data: { taxonomy: taxonomyCreated },
    } = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

    dispatch(SurveyActions.metaUpdated())

    if (inTaxonomiesPath || A.isNull(onTaxonomyCreated)) {
      history.push(`${appModuleUri(designerModules.taxonomy)}${Taxonomy.getUuid(taxonomyCreated)}`)
    } else {
      onTaxonomyCreated(taxonomyCreated)
    }
  }, [])

  return (
    <button type="button" onClick={add} className="btn btn-s">
      <span className="icon icon-plus icon-12px icon-left" />
      {i18n.t('common.add')}
    </button>
  )
}

ButtonTaxonomyAdd.propTypes = {
  onTaxonomyCreated: PropTypes.func,
}

ButtonTaxonomyAdd.defaultProps = {
  onTaxonomyCreated: () => ({}),
}

export default ButtonTaxonomyAdd
