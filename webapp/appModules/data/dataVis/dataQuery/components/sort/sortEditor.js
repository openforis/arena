import './sortEditor.scss'

import React from 'react'
import { connect } from 'react-redux'

import Expression from '../../../../../../../common/exprParser/expression'

import Popup from '../../../../../../commonComponents/popup'
import SortRow from './sortRow'

import * as SurveyState from '../../../../../../survey/surveyState'

import Survey from '../../../../../../../common/survey/survey'

import * as Sort from './sort'

import * as ExpressionVariables from '../../../../../../commonComponents/expression/expressionVariables'

class SortExpressionComponent extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      edit: false,
      sortCriteria: Sort.deserialize(props.sort),
      unchosenVariables: [],
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
      const newSortCriteria = Sort.getNewCriteria(sortCriteria, availableVariables)

      this.setState({ sortCriteria: newSortCriteria },
        () => this.refreshUnchosenVariables())
    }
  }

  onSelectVariable (pos, variable) {
    const { sortCriteria } = this.state

    this.setState({ sortCriteria: Sort.update(sortCriteria, pos, 'variable', variable) },
      () => this.refreshUnchosenVariables())
  }

  onSelectOrder (pos, order) {
    const { sortCriteria } = this.state

    this.setState({ sortCriteria: Sort.update(sortCriteria, pos, 'order', order) })
  }

  refreshUnchosenVariables () {
    const { availableVariables } = this.props
    const { sortCriteria } = this.state

    this.setState({ unchosenVariables: Sort.getUnchosenVariables(sortCriteria, availableVariables) })
  }

  addCriteria ({ value: variable }) {
    const { sortCriteria } = this.state

    this.setState({ sortCriteria: Sort.addCriteria(sortCriteria, variable, 'asc') },
      () => this.refreshUnchosenVariables())
  }

  deleteCriteria (pos) {
    const { sortCriteria } = this.state

    this.setState({ sortCriteria: Sort.deleteCriteria(sortCriteria, pos) },
      () => this.refreshUnchosenVariables())
  }

  applyChange () {
    const { sortCriteria } = this.state
    const { onChange, onClose } = this.props

    onChange && onChange(Sort.serialize(sortCriteria))
    onClose()
  }

  reset () {
    this.setState({ sortCriteria: [] },
      () => this.applyChange())
  }

  render () {
    const { onClose } = this.props
    const { edit, sortCriteria, unchosenVariables } = this.state

    return (
      <div className={`sort-editor${edit ? ' edit' : ''}`}>
        {
          <Popup
            onClose={onClose}
            padding={20}>

            <React.Fragment>
              <div className="sort-editor__criteria">
                {sortCriteria.map((criteria, pos) =>
                  <SortRow
                    key={criteria.variable}
                    variables={unchosenVariables}
                    selectedVariable={criteria.variable}
                    onSelectVariable={item => this.onSelectVariable(pos, item.value)}
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
                        aria-disabled={!sortCriteria.length}>
                  <span className="icon icon-checkmark icon-16px"/> Apply
                </button>
              </div>
            </React.Fragment>

          </Popup>
        }

      </div>
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