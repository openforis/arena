import { useState, useEffect } from 'react'

import * as Survey from '@core/survey/survey'
import * as DataSort from '@common/surveyRdb/dataSort'

import { useSurvey } from '@webapp/store/survey'

import { usePrevious } from '@webapp/components/hooks'
import * as ExpressionVariables from '@webapp/components/expression/expressionVariables'

export default (props) => {
  const { mode, nodeDefUuidContext, nodeDefUuidCols, onChange, onClose, sort } = props

  const survey = useSurvey()

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)

  const [sortCriteria, setSortCriteria] = useState(sort)

  // Keep reference of old sortCriteria
  const sortCriteriaStrPrev = usePrevious(DataSort.toString(sort), '')

  const [unchosenVariables, setUnchosenVariables] = useState([])
  const [updated, setUpdated] = useState(false)

  const getAvailableVariables = () => {
    const variables = ExpressionVariables.getVariables(survey, nodeDefContext, null, mode)
    return variables.filter((v) => nodeDefUuidCols.includes(v.uuid))
  }

  const availableVariables = getAvailableVariables()

  const refreshUnchosenVariables = () => {
    setUnchosenVariables(DataSort.getUnchosenVariables(availableVariables)(sortCriteria))
  }

  useEffect(() => {
    refreshUnchosenVariables()
  }, [sortCriteria])

  const onSelectVariable = (pos, variable) => {
    setSortCriteria(DataSort.updateVariable(pos, variable)(sortCriteria))
  }

  const updateSortCriteria = (updateFn) => {
    setSortCriteria(updateFn(sortCriteria))
    setUpdated(true)
  }

  const onSelectOrder = (pos, order) => updateSortCriteria(DataSort.updateOrder(pos, order))

  const addCriteria = ({ value: variable, label }) =>
    updateSortCriteria(DataSort.addCriteria(variable, label, DataSort.keys.order.asc))

  const deleteCriteria = (pos) => updateSortCriteria(DataSort.deleteCriteria(pos))

  const applyAndClose = (sortCriteriaUpdate) => {
    if (DataSort.toString(sortCriteriaUpdate) !== sortCriteriaStrPrev) {
      if (onChange) {
        onChange(sortCriteriaUpdate)
      }
    }
    onClose()
  }

  const applyChange = () => applyAndClose(sortCriteria)

  const reset = () => {
    applyAndClose([])
  }

  return {
    addCriteria,
    applyChange,
    availableVariables,
    deleteCriteria,
    onSelectOrder,
    onSelectVariable,
    reset,
    sortCriteria,
    unchosenVariables,
    updated,
  }
}
