import './sortEditor.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Expression from '../../../../../../../common/exprParser/expression'

import Popup from '../../../../../../commonComponents/popup'
import SortRow from './sortRow'

import * as SurveyState from '../../../../../../survey/surveyState'
import Survey from '../../../../../../../common/survey/survey'

import * as DataQueryState from '../../dataQueryState'
import * as ExpressionVariables from '../../../../../../commonComponents/expression/expressionVariables'

class SortExpressionComponent extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      edit: false,
      sortCriteria: R.clone(props.sort),
      availableVariables: [],
      unchosenVariables: []
    }

    this.toggleEdit = this.toggleEdit.bind(this)
  }

  componentDidUpdate (prevProps) {
    const { availableVariables } = this.props
    const { sortCriteria } = this.state

    // Only show selected variables in the dropdown menu
    if (availableVariables !== prevProps.availableVariables) {

      // reset available variables and remove unavailable variables from criteria
      const newSortCriteria = sortCriteria.filter(c => availableVariables.findIndex(v => v.value === c.variable) !== -1)

      this.setState({
          availableVariables,
          sortCriteria: newSortCriteria,
        },
        () => this.refreshUnchosenVariables())
    }
  }

  updateSort (pos, key, value) {
    const { sortCriteria } = this.state

    const newVarSortCriteria = R.pipe(
      R.nth(pos),
      R.assoc(key, value)
    )(sortCriteria)

    this.setState({
        sortCriteria: R.update(pos, newVarSortCriteria, sortCriteria)
      },
      () => this.refreshUnchosenVariables())
  }

  onSelectVariable (pos, variable) {
    this.updateSort(pos, 'variable', variable)
  }

  onSelectOrder (pos, order) {
    this.updateSort(pos, 'order', order)
  }

  refreshUnchosenVariables () {
    const { availableVariables, sortCriteria } = this.state

    const unchosenVariables = availableVariables.filter(v => sortCriteria.findIndex(sc => sc.variable === v.value) === -1)
    this.setState({ unchosenVariables })
  }

  addCriteria ({ value: variable }) {
    const { sortCriteria } = this.state

    const newSortCriteria = R.append({ variable, order: 'asc' }, sortCriteria)
    this.setState({
        sortCriteria: newSortCriteria,
      },
      () => this.refreshUnchosenVariables())
  }

  toggleEdit () {
    this.setState(state => ({ edit: !state.edit }))
  }

  deleteCriteria (pos) {
    this.setState({
        sortCriteria: R.remove(pos, 1, this.state.sortCriteria)
      },
      () => this.refreshUnchosenVariables())
  }

  applyChange (query) {
    const { onChange } = this.props

    onChange && onChange(query)
    this.toggleEdit()
  }

  reset () {
    this.setState(
      { sortCriteria: [] }
    )
    this.applyChange([])
  }

  render () {
    const { edit, sortCriteria, unchosenVariables } = this.state

    return (
      <div className={`sort-editor${edit ? ' edit' : ''}`}>
        {
          edit
            ? (
              <Popup
                onClose={this.toggleEdit}
                padding={20}>

                <React.Fragment>
                  <div className="sort-editor__criteria">
                    {sortCriteria.map((criteria, pos) =>
                      <SortRow key={criteria.variable}
                               variables={unchosenVariables}
                               selectedVariable={criteria.variable}
                               onSelectVariable={item => this.onSelectVariable(pos, item.value)}
                               selectedOrder={criteria.order}
                               onSelectOrder={order => this.onSelectOrder(pos, order)}
                               onDelete={() => this.deleteCriteria(pos)}
                               isFirst={!pos}/>)}

                    {
                      !!unchosenVariables.length &&
                      <SortRow variables={unchosenVariables}
                               onSelectVariable={item => this.addCriteria(item)}
                               isPlaceholder={true}
                               isFirst={!sortCriteria.length}></SortRow>
                    }
                  </div>
                  <div className="sort-editor__footer">
                    <button className="btn btn-xs btn-of"
                            onClick={() => this.reset()}
                            aria-disabled={!sortCriteria.length}>
                      <span className="icon icon-undo2 icon-16px"/> Reset
                    </button>

                    <button className="btn btn-xs btn-of"
                            onClick={() => this.applyChange(sortCriteria)}
                            aria-disabled={!sortCriteria.length}>
                      <span className="icon icon-checkmark icon-16px"/> Apply
                    </button>
                  </div>
                </React.Fragment>

              </Popup>
            ) : (
              <div className="sort__query-container">
                <button className="btn btn-s btn-of-light btn-edit"
                        onClick={this.toggleEdit}>
                  <span className="icon icon-pencil2 icon-14px"/>
                </button>
              </div>
            )
        }

      </div>
    )
  }
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)

  const {
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    isContextParent = false,
  } = props

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null
  const mode = Expression.modes.sql
  const depth = isContextParent ? 0 : 1
  const variables = ExpressionVariables.getVariables(survey, nodeDefContext, nodeDefCurrent, mode, depth)

  const availableVariables = variables.filter(v => nodeDefUuidCols.indexOf(v.uuid) !== -1)

  return {
    availableVariables,
  }
}

export default connect(mapStateToProps)(SortExpressionComponent)