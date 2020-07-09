import { useCallback } from 'react'
import { matchPath, useHistory, useLocation } from 'react-router'
import { useDispatch } from 'react-redux'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonomyActions from '@webapp/views/App/views/Designer/TaxonomyDetail/actions'

import { State } from '../state'

export const useEdit = () => {
  const history = useHistory()
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))

  return useCallback(({ state }) => {
    const taxonomy = State.getTaxonomy(state)
    const taxonomyUuid = Taxonomy.getUuid(taxonomy)
    if (!inTaxonomiesPath) {
      dispatch(TaxonomyActions.setTaxonomyForEdit(taxonomyUuid))
      const onOpenTaxonomy = State.getOnOpenTaxonomy(state)
      if (onOpenTaxonomy) {
        onOpenTaxonomy(taxonomyUuid)
      }
    } else {
      history.push(`${appModuleUri(designerModules.taxonomy)}${taxonomyUuid}/`)
    }
  }, [])
}
