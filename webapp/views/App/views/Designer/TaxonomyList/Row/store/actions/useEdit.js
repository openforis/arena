import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { matchPath, useHistory, useLocation } from 'react-router'

import * as ObjectUtils from '@core/objectUtils'
import { appModuleUri, designerModules } from '@webapp/app/appModules'

import * as TaxonomyActions from '@webapp/loggedin/surveyViews/taxonomy/actions'
import * as Taxonomy from '@core/survey/taxonomy'

import { State } from '../state'

export const useEdit = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const { pathname } = useLocation()
  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))
  const itemLink = inTaxonomiesPath ? appModuleUri(designerModules.taxonomy) : null

  return useCallback(({ state }) => {
    const taxonomy = State.getTaxonomy(state)
    if (!inTaxonomiesPath) {
      dispatch(TaxonomyActions.setTaxonomyForEdit(Taxonomy.getUuid(taxonomy)))
    } else {
      history.push(`${itemLink}${ObjectUtils.getUuid(taxonomy)}/`)
    }
  }, [])
}
