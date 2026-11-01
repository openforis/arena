import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router'

import { useIsTaxonomiesRoute, useOnBrowserBack } from '@webapp/components/hooks'

import { useAuthCanEditSurvey } from '@webapp/store/user'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = (props) => {
  const { taxonomyUuid: taxonomyUuidProp } = props
  const { taxonomyUuid: taxonomyUuidParam } = useParams()

  const taxonomyUuid = taxonomyUuidParam || taxonomyUuidProp

  const isTaxonomiesRoute = useIsTaxonomiesRoute()
  const canEdit = useAuthCanEditSurvey()

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  useEffect(() => {
    Actions.init({ state, taxonomyUuid })
  }, [])

  const deleteTaxonomyIfEmpty = useCallback(async () => Actions.deleteTaxonomyIfEmpty({ taxonomyUuid }), [])

  useOnBrowserBack({
    active: isTaxonomiesRoute && canEdit && State.isTaxonomyEmpty(state) && !State.isDeleted(state),
    onBack: deleteTaxonomyIfEmpty,
  })

  return { state, Actions }
}
