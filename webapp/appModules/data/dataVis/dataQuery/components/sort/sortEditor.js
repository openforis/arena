import './sortEditor.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import memoize from 'memoize-one'


import * as SurveyState from '../../../../../../survey/surveyState'
import Survey from '../../../../../../../common/survey/survey'

import * as ExpressionVariables from '../../../../../../commonComponents/expression/expressionVariables' // TODO
import Popup from '../../../../../../commonComponents/popup'

import * as DataQueryState from '../../dataQueryState'

import { elementOffset } from '../../../../../../appUtils/domUtils'

import SortRow from './sortRow'

class SortExpressionComponent extends React.Component {

  constructor (props) {
    super(props)

    const { variables } = props

    this.state = {
      edit: false,
      sortCriteria: [],
      unchosenVariables: variables
    }

    this.elementRef = React.createRef()

    this.toggleEdit = this.toggleEdit.bind(this)
    this.getStyle = memoize(this.getStyle.bind(this))
  }

  getStyle (edit) {
    const elemOffset = edit ? elementOffset(this.elementRef.current) : null
    const padding = 20
    return elemOffset
      ? { padding, top: (elemOffset.top - padding) + 'px', left: (elemOffset.left - padding) + 'px' }
      : {}
  }

  updateSort (pos, key, value) {
    const { sortCriteria } = this.state

    const newVarSortCriteria = R.pipe(
      R.nth(pos),
      R.assoc(key, value)
    )(sortCriteria)

    this.setState({ sortCriteria: R.update(pos, newVarSortCriteria, sortCriteria) })
  }

  onSelectVariable (pos, variable) {
    this.updateSort(pos, 'variable', variable)
  }

  onSelectOrder (pos, order) {
    this.updateSort(pos, 'order', order)
  }

  refreshUnchosenVariables () {
    const { sortCriteria } = this.state
    const { variables } = this.props

    const sortVariableNames = sortCriteria.map(c => c.variable)

    const unchosenVariables = variables.filter(v => !sortVariableNames.find(sv => sv === v.value))
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

  // componentDidUpdate (prevProps) {
  //   console.log(prevProps)
  //   console.log(this.props)
  // }

  serialize () {
    const { sortCriteria } = this.state

    return sortCriteria.map(c => `${c.variable} ${c.order}`).join(', ')
  }

  render () {

    const {
      // query,
      onChange,
    } = this.props

    const { edit, sortCriteria, unchosenVariables } = this.state

    return <div className={`expression${edit ? ' edit' : ''}`}
                ref={this.elementRef}
                style={this.getStyle(edit)}>
      {
        edit
          ? (
            <Popup onClose={this.toggleEdit}>
              <React.Fragment>
                <div className="sort-editor__criteria">
                  {sortCriteria.map((criteria, pos) =>
                    <SortRow key={criteria.variable}
                             variables={unchosenVariables}
                             selectedVariable={criteria.variable}
                             onSelectVariable={item => this.onSelectVariable(pos, item.value)}
                             selectedOrder={criteria.order}
                             onSelectOrder={order => this.onSelectOrder(pos, order)}
                             onDelete={() => this.deleteCriteria(pos)}/>)}
                  {
                    !!unchosenVariables.length && <SortRow variables={unchosenVariables}
                                                           onSelectVariable={item => this.addCriteria(item)}
                                                           isPlaceholder={true}></SortRow>
                  }
                </div>
                <div className="sort-editor__footer">
                  <button className="btn btn-xs btn-of"
                          onClick={() => onChange('')}
                          aria-disabled={!sortCriteria.length}>
                    <span className="icon icon-undo2 icon-16px"/> Reset
                  </button>

                  <button className="btn btn-xs btn-of"
                          onClick={() => onChange(sortCriteria)}
                          aria-disabled={!sortCriteria.length}>
                    <span className="icon icon-checkmark icon-16px"/> Apply
                  </button>
                </div>
              </React.Fragment>
            </Popup>
          ) : (
            <div className="expression__query-container">
              {/* {
                !R.isEmpty(query) &&
                <div className="query">{query}</div>
              } */}
              <button className="btn btn-s btn-of-light btn-edit"
                      onClick={this.toggleEdit}>
                <span className="icon icon-sort-amount-asc icon-14px" />
              </button>
            </div>
          )
      }

    </div>
  }
}

SortExpressionComponent.defaultProps = {
  isContextParent: false,
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)

  const {
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    mode = SortExpressionComponent.defaultProps.mode,
    isContextParent = SortExpressionComponent.defaultProps.isContextParent,
  } = props

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null
  const depth = isContextParent ? 0 : 1
  const variables = ExpressionVariables.getVariables(survey, nodeDefContext, nodeDefCurrent, mode, depth)

  return {
    variables,
    nodeDefUuidCols,
  }
}

export default connect(mapStateToProps)(SortExpressionComponent)

