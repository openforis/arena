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

  if (isTaxonomiesRoute) {
    const taxonomyEmpty = State.isTaxonomyEmpty(state)
    const deleted = State.isDeleted(state)

    const deleteTaxonomyIfEmpty = useCallback(async () => Actions.deleteTaxonomyIfEmpty({ taxonomyUuid }), [])

    useOnBrowserBack({
      active: canEdit && taxonomyEmpty && !deleted,
      onBack: deleteTaxonomyIfEmpty,
    })
  }

  return { state, Actions }
}
