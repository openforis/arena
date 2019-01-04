import './nodeDefsSelector.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { nbsp } from '../../../../../common/stringUtils'

import Dropdown from '../../../../commonComponents/form/dropdown'
import VariablesSelector from './variablesSelector'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import * as SurveyState from '../../../../survey/surveyState'
import * as NodeDefUiProps from '../../../surveyForm/nodeDefs/nodeDefSystemProps'

import { initDataTable } from '../actions'

const TableSelector = ({hierarchy, nodeDefUuid, lang, onChange}) => {
  const entities = []
  const traverse = (nodeDef, depth) => {
    const label = NodeDef.getNodeDefLabel(nodeDef, lang)
    entities.push({
      key: NodeDef.getUuid(nodeDef),
      value: nbsp + R.repeat(nbsp + nbsp, depth).join('') + label
    })
  }
  Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

  return (
    <Dropdown className="node-def-dropdown"
              items={entities} selection={entities.find(R.propEq('key', nodeDefUuid))}
              autocompleteDialogClassName="node-def-dropdown__autocomplete-dialog"
              onChange={item => onChange(R.prop('key', item))}
    />
  )
}

class NodeDefsSelector extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      nodeDefUuid: null,
      nodeDefVariableUuids: [],
      showSettings: false,
      filterTypes: [],
    }
  }

  render () {
    const {
      hierarchy, lang,
      initDataTable,
    } = this.props
    const {nodeDefUuid, nodeDefVariableUuids, showSettings, filterTypes} = this.state

    return (
      <div className="node-defs-selector">

        <div className="variables-selector">
          <div className="variables-selector__container">

            <div>
              <button className="btn btn-s btn-of-light-xs btn-toggle-vars-filter"
                      aria-disabled={R.isNil(nodeDefUuid)}
                      onClick={() => this.setState(state => ({showSettings: !state.showSettings}))}>
                <span className="icon icon-cog icon-12px"/>
              </button>
              <TableSelector hierarchy={hierarchy} nodeDefUuid={nodeDefUuid}
                             lang={lang} onChange={nodeDefUuid => this.setState({nodeDefUuid})}/>
            </div>

            {
              showSettings &&
              <div className="variables-selector__settings">
                {
                  R.keys(NodeDef.nodeDefType).map(type =>
                    NodeDef.nodeDefType.entity !== type
                      ? <button key={type}
                                className={`btn btn-s btn-of-light-s btn-node-def-type${R.includes(type, filterTypes) ? ' active' : ''}`}
                                onClick={() => {
                                  const idx = R.findIndex(R.equals(type), filterTypes)
                                  const fn = idx >= 0 ? R.remove(idx, 1) : R.append(type)
                                  this.setState({filterTypes: fn(filterTypes)})
                                }}>
                        {NodeDefUiProps.getNodeDefIconByType(type)} {type}</button>
                      : null
                  )
                }
              </div>
            }

            <VariablesSelector nodeDefUuid={nodeDefUuid} lang={lang}
                               onChange={nodeDefVariableUuids => this.setState({nodeDefVariableUuids})}
                               filterTypes={filterTypes}/>
          </div>
        </div>

        <button className="btn btn-of-light btn-sync"
                onClick={() => initDataTable(nodeDefUuid, nodeDefVariableUuids)}
                aria-disabled={R.isEmpty(nodeDefVariableUuids)}>
          Sync
          <span className="icon icon-loop icon-16px icon-right"/>
          {/*<span className="icon icon-spinner10 icon-20px icon-right"/>*/}
        </button>
      </div>
    )
  }
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  return {
    lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
    hierarchy: Survey.getHierarchy()(survey),
  }
}

export default connect(
  mapStateToProps,
  {initDataTable}
)(NodeDefsSelector)


