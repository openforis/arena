import './variablesSelector.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { nbsp } from '../../../../../common/stringUtils'

import Dropdown from '../../../../commonComponents/form/dropdown'

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

class Variables extends React.Component {
  render () {
    const {
      survey,
      nodeDefUuid, lang,
      nodeDefVariableUuids, toggleNodeDefVariable,
      filterTypes,
      showAncestors,
    } = this.props

    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
    const childDefs = nodeDefUuid
      ? Survey.getNodeDefChildren(nodeDef)(survey)
      : []

    const filtered = nodeDef => NodeDef.isNodeDefAttribute(nodeDef) &&
      (R.isEmpty(filterTypes) || R.includes(NodeDef.getType(nodeDef), filterTypes))

    return childDefs
      ? (
        <React.Fragment>
          {
            childDefs.map(
              childDef => {
                const childDefUuid = NodeDef.getUuid(childDef)

                return filtered(childDef)
                  ? (
                    <button key={childDefUuid}
                            className={`btn btn-s btn-of-light btn-node-def${R.includes(childDefUuid, nodeDefVariableUuids) ? ' active' : ''}`}
                            onClick={() => toggleNodeDefVariable(childDefUuid)}>
                      {NodeDef.getNodeDefLabel(childDef, lang)}
                      {NodeDefUiProps.getNodeDefIconByType(NodeDef.getType(childDef))}
                    </button>
                  )
                  : null
              }
            )
          }

          {
            nodeDefParent && showAncestors &&
            <React.Fragment>
              <div className="node-def-label">{NodeDef.getNodeDefLabel(nodeDefParent, lang)}</div>
              <Variables {...this.props}
                         nodeDefUuid={NodeDef.getUuid(nodeDefParent)}/>
            </React.Fragment>
          }

        </React.Fragment>
      )
      : null
  }
}

Variables.defaultProps = {
  nodeDefUuid: null,
  lang: null,
  showAncestors: true,
}

class VariablesSelectionHandler extends React.PureComponent {

  constructor (props) {
    super(props)
    this.state = { nodeDefVariableUuids: [] }
  }

  toggleNodeDefVariable (nodeDefUuid) {
    const { canSelectVariables } = this.props

    if (canSelectVariables) {
      const { nodeDefVariableUuids: nodeDefVariableUuidsState } = this.state

      const idx = R.findIndex(R.equals(nodeDefUuid), nodeDefVariableUuidsState)
      const fn = idx >= 0 ? R.remove(idx, 1) : R.append(nodeDefUuid)
      const nodeDefVariableUuids = fn(nodeDefVariableUuidsState)

      this.updateNodeDefVariableUuids(nodeDefVariableUuids)
    }
  }

  updateNodeDefVariableUuids (nodeDefVariableUuids) {
    this.setState({ nodeDefVariableUuids })
    this.props.onChange(nodeDefVariableUuids)
  }

  componentDidUpdate (prevProps) {
    const { nodeDefUuid, canSelectVariables } = this.props
    const { nodeDefUuid: nodeDefUuidPrev } = prevProps
    if (canSelectVariables && nodeDefUuid !== nodeDefUuidPrev)
      this.updateNodeDefVariableUuids([])
  }

  render () {
    const { survey, nodeDefUuid, lang, filterTypes, showAncestors } = this.props
    const { nodeDefVariableUuids } = this.state

    return (
      <Variables survey={survey}
                 nodeDefUuid={nodeDefUuid} lang={lang}
                 nodeDefVariableUuids={nodeDefVariableUuids}
                 toggleNodeDefVariable={this.toggleNodeDefVariable.bind(this)}
                 filterTypes={filterTypes}
                 showAncestors={showAncestors} />
    )
  }

}

class VariablesSelector extends React.Component {

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
      survey,
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

          <VariablesSelectionHandler survey={survey}
                                     nodeDefUuid={nodeDefUuid}
                                     lang={lang}
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
    survey,
    lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
    hierarchy: Survey.getHierarchy()(survey),
  }
}

export default connect(mapStateToProps)(VariablesSelector)