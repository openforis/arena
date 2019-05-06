import './sortEditor.scss'

import React from 'react'
import { connect } from 'react-redux'

import Expression from '../../../../../../../../common/exprParser/expression'
import * as DataSort from '../../../../../../../../common/surveyRdb/dataSort'

import Popup from '../../../../../../../commonComponents/popup'
import * as ExpressionVariables from '../../../../../../../commonComponents/expression/expressionVariables'

import SortRow from './sortRow'

import Survey from '../../../../../../../../common/survey/survey'

import * as SurveyState from '../../../../../../../survey/surveyState'

class SortExpressionComponent extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      edit: false,
      sortCriteria: props.sort,
      unchosenVariables: [],
      updated: false,
    }
  }

  componentDidMount () {
    this.refreshUnchosenVariables()
  }

  componentDidUpdate (prevProps) {
    const { availableVariables } = this.props
    const { availableVariables: prevAvailableVariables } = prevProps
    const { sortCriteria } = this.state

    // Only show selected variables in the dropdown menu
    if (availableVariables !== prevAvailableVariables) {
      // reset available variables and remove unavailable variables from criteria
      const newSortCriteria = DataSort.getNewCriteria(availableVariables)(sortCriteria)

      this.setState({ sortCriteria: newSortCriteria },
        () => this.refreshUnchosenVariables())
    }
  }

  onSelectVariable (pos, variable) {
    const { sortCriteria } = this.state

    this.setState({
      sortCriteria: DataSort.updateVariable(pos, variable)(sortCriteria),
      updated: true,
    },
    () => this.refreshUnchosenVariables())
  }

  onSelectOrder (pos, order) {
    const { sortCriteria } = this.state

    this.setState({
      sortCriteria: DataSort.updateOrder(pos, order)(sortCriteria),
      updated: true,
    })
  }

  refreshUnchosenVariables () {
    const { availableVariables } = this.props
    const { sortCriteria } = this.state

    this.setState({ unchosenVariables: DataSort.getUnchosenVariables(availableVariables)(sortCriteria) })
  }

  addCriteria ({ value: variable, label }) {
    const { sortCriteria } = this.state

    this.setState({
      sortCriteria: DataSort.addCriteria(variable, label, DataSort.keys.order.asc)(sortCriteria),
      updated: true,
    },
    () => this.refreshUnchosenVariables())
  }

  deleteCriteria (pos) {
    const { sortCriteria } = this.state

    this.setState({
      sortCriteria: DataSort.deleteCriteria(pos)(sortCriteria),
      updated: true,
    },
    () => this.refreshUnchosenVariables())
  }

  applyChange () {
    const { sortCriteria } = this.state
    const { onChange, onClose } = this.props

    onChange && onChange(sortCriteria)
    onClose()
  }

  reset () {
    this.setState({ sortCriteria: [] },
      () => this.applyChange())
  }

  render () {
    const { onClose, availableVariables } = this.props
    const { sortCriteria, unchosenVariables, updated } = this.state

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
                selectedVariable={DataSort.getVariable(availableVariables, criteria.variable)}
                onSelectVariable={item => this.onSelectVariable(pos, item)}
                selectedOrder={criteria.order}
                onSelectOrder={order => this.onSelectOrder(pos, order)}
                onDelete={() => this.deleteCriteria(pos)}
                isFirst={!pos}/>)}

            {
              !!unchosenVariables.length &&
              <SortRow
                variables={unchosenVariables}
                onSelectVariable={item => this.addCriteria(item)}
                isPlaceholder={true}
                isFirst={!sortCriteria.length}/>
            }
          </div>
          <div className="sort-editor__footer">
            <button className="btn btn-xs btn-of"
                    onClick={() => this.reset()}
                    aria-disabled={!sortCriteria.length}>
              <span className="icon icon-undo2 icon-16px"/> Reset
            </button>

            <button className="btn btn-xs btn-of"
                    onClick={() => this.applyChange()}
                    aria-disabled={!updated}>
              <span className="icon icon-checkmark icon-16px"/> Apply
            </button>
          </div>
        </React.Fragment>

      </Popup>
    )
  }
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
  const variables = ExpressionVariables.getVariables(survey, nodeDefContext, nodeDefCurrent, mode, depth)

  return {
    availableVariables: variables.filter(v => nodeDefUuidCols.indexOf(v.uuid) !== -1),
  }
}

export default connect(mapStateToProps)(SortExpressionComponent)