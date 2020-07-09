import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { matchPath, useHistory, useLocation } from 'react-router'

import * as ObjectUtils from '@core/objectUtils'
import { appModuleUri, designerModules } from '@webapp/app/appModules'

import * as TaxonomyActions from '@webapp/views/App/views/Designer/TaxonomyDetail/actions'
import * as Taxonomy from '@core/survey/taxonomy'

import { State } from '../state'

export const useEdit = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const { pathname } = useLocation()
  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))

  return useCallback(({ state }) => {
    const taxonomy = State.getTaxonomy(state)
    if (!inTaxonomiesPath) {
      dispatch(TaxonomyActions.setTaxonomyForEdit(Taxonomy.getUuid(taxonomy)))
    } else {
      history.push(`${appModuleUri(designerModules.taxonomy)}${ObjectUtils.getUuid(taxonomy)}/`)
    }
  }, [])
}
