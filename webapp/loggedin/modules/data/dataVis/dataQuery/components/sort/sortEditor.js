import './sortEditor.scss'

import React, {useState, useEffect} from 'react'
import {connect} from 'react-redux'

import * as Expression from '@core/expressionParser/expression'
import * as DataSort from '@common/surveyRdb/dataSort'

import Popup from '@webapp/commonComponents/popup'
import * as ExpressionVariables from '@webapp/commonComponents/expression/expressionVariables'
import {useI18n, usePrevious} from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'

import * as SurveyState from '@webapp/survey/surveyState'
import SortRow from './sortRow'

const SortExpressionComponent = props => {
  const {lang} = useI18n()

  const {onClose} = props

  const [sortCriteria, setSortCriteria] = useState(props.sort)

  // Keep reference of old sortCriteria
  const sortCriteriaStrPrev = usePrevious(DataSort.toString(props.sort), '')

  const [unchosenVariables, setUnchosenVariables] = useState([])
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    refreshUnchosenVariables()
  }, [sortCriteria])

  const onSelectVariable = (pos, variable) => {
    setSortCriteria(DataSort.updateVariable(pos, variable)(sortCriteria))
  }

  const onSelectOrder = (pos, order) => {
    setSortCriteria(DataSort.updateOrder(pos, order)(sortCriteria))
    setUpdated(true)
  }

  const refreshUnchosenVariables = () => {
    const availableVariables = getAvailableVariables(props, lang)
    setUnchosenVariables(
      DataSort.getUnchosenVariables(availableVariables)(sortCriteria),
    )
  }

  const addCriteria = ({value: variable, label}) => {
    setSortCriteria(
      DataSort.addCriteria(
        variable,
        label,
        DataSort.keys.order.asc,
      )(sortCriteria),
    )
    setUpdated(true)
  }

  const deleteCriteria = pos => {
    setSortCriteria(DataSort.deleteCriteria(pos)(sortCriteria))
    setUpdated(true)
  }

  const applyAndClose = sortCriteria => {
    const {onChange, onClose} = props

    if (DataSort.toString(sortCriteria) !== sortCriteriaStrPrev) {
      onChange && onChange(sortCriteria)
    }

    onClose()
  }

  const applyChange = () => {
    applyAndClose(sortCriteria)
  }

  const reset = () => {
    applyAndClose([])
  }

  const getAvailableVariables = () => {
    const {survey, nodeDefUuidCols, nodeDefContext, mode} = props

    const variables = ExpressionVariables.getVariables(
      survey,
      nodeDefContext,
      null,
      mode,
      lang,
    )
    return variables.filter(v => nodeDefUuidCols.includes(v.uuid))
  }

  const availableVariables = getAvailableVariables()

  return (
    <Popup className="sort-editor-popup" onClose={onClose} padding={20}>
      <React.Fragment>
        <div className="sort-editor__criteria">
          {sortCriteria.map((criteria, pos) => (
            <SortRow
              key={criteria.variable}
              variables={unchosenVariables}
              selectedVariable={DataSort.findVariableByValue(criteria.variable)(
                availableVariables,
              )}
              onSelectVariable={item => onSelectVariable(pos, item)}
              selectedOrder={criteria.order}
              onSelectOrder={order => onSelectOrder(pos, order)}
              onDelete={() => deleteCriteria(pos)}
              isFirst={!pos}
            />
          ))}

          {Boolean(unchosenVariables.length) && (
            <SortRow
              variables={unchosenVariables}
              onSelectVariable={item => addCriteria(item)}
              isPlaceholder={true}
              isFirst={!sortCriteria.length}
            />
          )}
        </div>
        <div className="sort-editor__footer">
          <button
            className="btn btn-xs"
            onClick={() => reset()}
            aria-disabled={!sortCriteria.length}
          >
            <span className="icon icon-undo2 icon-16px" /> Reset
          </button>

          <button
            className="btn btn-xs"
            onClick={() => applyChange()}
            aria-disabled={!updated}
          >
            <span className="icon icon-checkmark icon-16px" /> Apply
          </button>
        </div>
      </React.Fragment>
    </Popup>
  )
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)

  const {nodeDefUuidContext, nodeDefUuidCols} = props

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const mode = Expression.modes.sql

  return {
    survey,
    nodeDefUuidCols,
    nodeDefContext,
    mode,
  }
}

export default connect(mapStateToProps)(SortExpressionComponent)
