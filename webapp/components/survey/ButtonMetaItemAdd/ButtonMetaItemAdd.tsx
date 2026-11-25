import { useCallback } from 'react'

import { ButtonAdd } from '@webapp/components'
import * as API from '@webapp/service/api'
import { useAppDispatch } from '@webapp/store'
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

type ButtonMetaItemAddProps = {
  id?: string
  onAdd: (...args: any[]) => any
  metaItemType: string
  variant?: 'contained' | 'outlined' | 'text'
}

const ButtonMetaItemAdd = (props: ButtonMetaItemAddProps) => {
  const { id, onAdd, metaItemType, variant } = props

  const dispatch = useAppDispatch()
  const surveyId = useSurveyId()

  const add = useCallback(async () => {
    if (creatorsByType[metaItemType]) {
      const item = await creatorsByType[metaItemType]({ surveyId })
      const action = actionsByType[metaItemType]
      dispatch(action(item))
      dispatch(SurveyActions.metaUpdated())
      onAdd(item)
    }
  }, [dispatch, metaItemType, onAdd, surveyId])

  return <ButtonAdd testId={id} onClick={add} className={`btn-add-${metaItemType}`} size="small" variant={variant} />
}

export default ButtonMetaItemAdd
