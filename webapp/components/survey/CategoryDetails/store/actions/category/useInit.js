import { useCallback } from 'react'

import { matchPath, useLocation } from 'react-router'

import { designerModules, appModuleUri } from '@webapp/app/appModules'

import * as API from '@webapp/service/api'

import { useSurveyId } from '@webapp/store/survey'

import { useFetchLevelItems } from '../item/useFetchLevelItems'
import { State } from '../../state'

export const useInit = ({ setState }) => {
  const surveyId = useSurveyId()
  const fetchLevelItems = useFetchLevelItems({ setState })
  const { pathname } = useLocation()

  return useCallback(async ({ categoryUuid }) => {
    const category = await API.fetchCategory({ surveyId, categoryUuid })

    const inCategoriesPath = Boolean(matchPath(pathname, `${appModuleUri(designerModules.category)}:uuid/`))

    const stateUpdated = State.create({ category, categoryUuid, inCategoriesPath })
    setState(stateUpdated)
    await fetchLevelItems({ state: stateUpdated })
  }, [])
}
