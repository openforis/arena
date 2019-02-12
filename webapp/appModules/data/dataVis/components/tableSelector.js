import './tableSelector.scss'

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

const TablesMenu = ({ hierarchy, nodeDefUuid, lang, onChange }) => {
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

class TableSelector extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      nodeDefUuid: null,
      nodeDefVariableUuids: [],
      showSettings: false,
      filterTypes: [],
    }
  }

  onNodeDefUuidChange (nodeDefUuid) {
    const { onTableChange } = this.props

    onTableChange && onTableChange(nodeDefUuid)
    this.setState({ nodeDefUuid })
  }

  componentDidUpdate ({ selectedTableUuid: prevUuid }) {
    const { selectedTableUuid } = this.props

    // uuid can be set from parent component
    if (prevUuid !== selectedTableUuid) {
      this.setState({ nodeDefUuid: selectedTableUuid })
    }
  }

  render () {
    const {
      hierarchy, lang,
      canSelectVariables,
      onVariablesChange,
      showAncestors,
    } = this.props
    const { nodeDefUuid, filterTypes, showSettings } = this.state

    return (
      <div className="tables-selector">
        <div className="tables-selector__container">

          <div>
            <button className="btn btn-s btn-of-light-xs btn-toggle-vars-filter"
                    aria-disabled={R.isNil(nodeDefUuid)}
                    onClick={() => this.setState(state => ({ showSettings: !state.showSettings }))}>
              <span className="icon icon-cog icon-12px" />
            </button>
            <TablesMenu hierarchy={hierarchy} nodeDefUuid={nodeDefUuid}
                        lang={lang}
                        onChange={nodeDefUuid => this.onNodeDefUuidChange(nodeDefUuid)} />
          </div>

          {
            showSettings &&
            <div className="tables-selector__settings">
              {
                R.keys(NodeDef.nodeDefType).map(type =>
                  NodeDef.nodeDefType.entity !== type
                    ? <button key={type}
                              className={`btn btn-s btn-of-light-s btn-node-def-type${R.includes(type, filterTypes) ? ' active' : ''}`}
                              onClick={() => {
                                const idx = R.findIndex(R.equals(type), filterTypes)
                                const fn = idx >= 0 ? R.remove(idx, 1) : R.append(type)
                                this.setState({ filterTypes: fn(filterTypes) })
                              }}>
                      {NodeDefUiProps.getNodeDefIconByType(type)} {type}</button>
                    : null
                )
              }
            </div>
          }

          <VariablesSelector nodeDefUuid={nodeDefUuid} lang={lang}
                             canSelectVariables={canSelectVariables}
                             onChange={onVariablesChange}
                             filterTypes={filterTypes}
                             showAncestors={showAncestors}/>
        </div>
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

export default connect(mapStateToProps)(TableSelector)