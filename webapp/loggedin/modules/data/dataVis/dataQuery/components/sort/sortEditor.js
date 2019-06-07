import './sortEditor.scss'

import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'

import Expression from '../../../../../../../../common/exprParser/expression'
import * as DataSort from '../../../../../../../../common/surveyRdb/dataSort'

import Popup from '../../../../../../../commonComponents/popup'
import * as ExpressionVariables from '../../../../../../../commonComponents/expression/expressionVariables'

import SortRow from './sortRow'

import Survey from '../../../../../../../../common/survey/survey'

import * as SurveyState from '../../../../../../../survey/surveyState'

import useI18n from '../../../../../../../commonComponents/useI18n'

const SortExpressionComponent = props => {

  const { lang } = useI18n()

  const { nodeDefUuidCols, onClose } = props

  const [sortCriteria, setSortCriteria] = useState(props.sort)
  const [unchosenVariables, setUnchosenVariables] = useState([])
  const [updated, setUpdated] = useState(false)

  useEffect(() => { refreshUnchosenVariables() }, [sortCriteria])

  useEffect(() => {
    // Only show selected variables in the dropdown menu
    // Reset available variables and remove unavailable variables from criteria
    const availableVariables = getAvailableVariables(props, lang)
    const newSortCriteria = DataSort.getNewCriteria(availableVariables)(sortCriteria)

    setSortCriteria(newSortCriteria)
  }, [nodeDefUuidCols])

  const onSelectVariable = (pos, variable) => {
    setSortCriteria(DataSort.updateVariable(pos, variable)(sortCriteria))
  }

  const onSelectOrder = (pos, order) => {
    setSortCriteria(DataSort.updateOrder(pos, order)(sortCriteria))
    setUpdated(true)
  }

  const refreshUnchosenVariables = () => {
    const availableVariables = getAvailableVariables(props, lang)
    setUnchosenVariables(DataSort.getUnchosenVariables(availableVariables)(sortCriteria))
  }

  const addCriteria = ({ value: variable, label }) => {
    setSortCriteria(DataSort.addCriteria(variable, label, DataSort.keys.order.asc)(sortCriteria))
    setUpdated(true)
  }

  const deleteCriteria = (pos) => {
    setSortCriteria(DataSort.deleteCriteria(pos)(sortCriteria))
    setUpdated(true)
  }

  const applyAndClose = (sortCriteria) => {
    const { onChange, onClose } = props

    onChange && onChange(sortCriteria)
    onClose()
  }

  const applyChange = () => {
    applyAndClose(sortCriteria)
  }

  const reset = () => {
    applyAndClose([])
  }

  const getAvailableVariables = () => {
    const {
      survey,
      nodeDefUuidCols,
      nodeDefContext,
      nodeDefCurrent,
      mode,
      depth,
    } = props

    const variables = ExpressionVariables.getVariables(survey, nodeDefContext, nodeDefCurrent, mode, depth, lang)
    return variables.filter(v => nodeDefUuidCols.indexOf(v.uuid) !== -1)
  }

  const availableVariables = getAvailableVariables()

  return (
    <Popup
      className="sort-editor-popup"
      onClose={onClose}
      padding={20}>

      <React.Fragment>
        <div className="sort-editor__criteria">
          {sortCriteria.map((criteria, pos) =>
            <SortRow
              key={criteria.variable}
              variables={unchosenVariables}
              selectedVariable={DataSort.findVariableByValue(criteria.variable)(availableVariables)}
              onSelectVariable={item => onSelectVariable(pos, item)}
              selectedOrder={criteria.order}
              onSelectOrder={order => onSelectOrder(pos, order)}
              onDelete={() => deleteCriteria(pos)}
              isFirst={!pos}/>)}

          {
            !!unchosenVariables.length &&
            <SortRow
              variables={unchosenVariables}
              onSelectVariable={item => addCriteria(item)}
              isPlaceholder={true}
              isFirst={!sortCriteria.length}/>
          }
        </div>
        <div className="sort-editor__footer">
          <button className="btn btn-xs btn-of"
                  onClick={() => reset()}
                  aria-disabled={!sortCriteria.length}>
            <span className="icon icon-undo2 icon-16px"/> Reset
          </button>

          <button className="btn btn-xs btn-of"
                  onClick={() => applyChange()}
                  aria-disabled={!updated}>
            <span className="icon icon-checkmark icon-16px"/> Apply
          </button>
        </div>
      </React.Fragment>

    </Popup>
  )
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)

  const {
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    nodeDefUuidCols,
  } = props

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null
  const mode = Expression.modes.sql
  const depth = 0

  return {
    survey,
    nodeDefUuidCols,
    nodeDefContext,
    nodeDefCurrent,
    mode,
    depth,
  }
}

export default connect(mapStateToProps)(SortExpressionComponent)