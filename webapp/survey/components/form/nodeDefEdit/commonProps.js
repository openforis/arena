import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { Input, FormItem } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'
import Dropdown from '../../../../commonComponents/form/dropdown'
import LabelsEditor from '../../labelsEditor'

import {
  nodeDefType,
  displayAs,
  getNodeDefLabels,
  getNodeDefDescriptions,
  getNodeDefName,
  getNodeDefProp,
  getNodeDefType,
  isNodeDefKey,
  isNodeDefMultiple,
  isNodeDefEntity,
  canNodeDefBeMultiple,
} from '../../../../../common/survey/nodeDef'
import { isRenderTable } from '../../../../../common/survey/nodeDefLayout'
import { newCodeList } from '../../../../../common/survey/codeList'
import { getSurveyCodeListsArray } from '../../../../../common/survey/survey'

import { normalizeName } from './../../../../../common/survey/surveyUtils'

import { getValidation, getFieldValidation } from './../../../../../common/validation/validator'

import { putNodeDefProp } from '../../../nodeDef/actions'
import CodeListEdit from '../../../codeList/components/codeListEdit'
import CodeListsEdit from '../../../codeList/components/codeListsEdit'
import { addCodeList } from '../../../codeList/actions'

class CommonProps extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      addingNewCodeList: false,
      newCodeListUUID: null,
      showingCodeListsManager: false,
    }
  }

  onPropLabelsChange (nodeDef, labelItem, key, currentValue) {
    this.props.putNodeDefProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
  }

  addNewCodeList () {
    const codeList = newCodeList()

    this.props.addCodeList(codeList)

    this.setState({
      addingNewCodeList: true,
      newCodeListUUID: codeList.uuid
    })
  }

  showCodeListsEditor () {

  }

  render () {
    const {survey, nodeDef, putNodeDefProp} = this.props
    const {addingNewCodeList, newCodeListUUID, showingCodeListsManager} = this.state

    const validation = getValidation(nodeDef)

    //NODE DEF CODE
    const codeLists = getSurveyCodeListsArray(survey)
    const codeNodeDefType = getNodeDefType(nodeDef) === nodeDefType.codeList
    const displayedAs = codeNodeDefType ?
      R.pipe(
        getNodeDefProp('displayAs'),
        R.defaultTo(displayAs.dropdown),
      )(nodeDef) : null

    const selectedCodeList = R.find(list => list.key === getNodeDefProp('codeListId')(nodeDef))(codeLists)
    const parentCodeAvailable = R.path(['levels', 'length'], selectedCodeList) > 0 //hierarchical TODO
    const possibleParentCodeItems = codeNodeDefType ? [] : [] //TODO
    const selectedParentCode = R.find(item => item.key === getNodeDefProp('parentCodeId')(nodeDef))(possibleParentCodeItems)

    return (
      addingNewCodeList
          ? <CodeListEdit codeListUUID={newCodeListUUID}/>
          : showingCodeListsManager
            ? <CodeListsEdit/>
            : <React.Fragment>
              <FormItem label={'name'}>
                <Input value={getNodeDefName(nodeDef)}
                       validation={getFieldValidation('name')(validation)}
                       onChange={e => putNodeDefProp(nodeDef, 'name', normalizeName(e.target.value))}/>
              </FormItem>

              <FormItem label={'type'}>
                <label>{nodeDef.type}</label>
              </FormItem>

              <LabelsEditor labels={getNodeDefLabels(nodeDef)}
                            onChange={(labelItem) => this.onPropLabelsChange(nodeDef, labelItem, 'labels', getNodeDefLabels(nodeDef))}/>

              <LabelsEditor formLabel="Description(s)"
                            labels={getNodeDefDescriptions(nodeDef)}
                            onChange={(labelItem) => this.onPropLabelsChange(nodeDef, labelItem, 'descriptions', getNodeDefDescriptions(nodeDef))}/>

              {
                codeNodeDefType
                  ? <React.Fragment>
                    <FormItem label={'Code List'}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '.8fr .1fr .1fr'
                      }}>
                        <Dropdown items={codeLists}
                                  selection={selectedCodeList}
                                  onChange={item => putNodeDefProp(nodeDef, 'codeListId', item.key)}/>
                        <button className="btn btn-s btn-of-light-xs"
                                style={{marginLeft: '50px'}}
                                onClick={() => this.addNewCodeList()}>
                          <span className="icon icon-plus icon-16px icon-left"/>
                          ADD
                        </button>
                        <button className="btn btn-s btn-of-light-xs"
                                style={{marginLeft: '50px'}}
                                onClick={() => this.showCodeListsEditor()}>
                          <span className="icon icon-plus icon-16px icon-left"/>
                          MANAGE
                        </button>
                      </div>
                    </FormItem>
                    <FormItem label={'Display As'}>
                      <div style={{display: 'grid', gridTemplateColumns: '.1fr .1fr'}}>
                        <button className={`btn btn-of-light ${displayedAs === displayAs.dropdown ? 'active': ''}`}
                                onClick={() => putNodeDefProp(nodeDef, 'displayAs', displayAs.dropdown)}>
                          Dropdown
                        </button>
                        <button className={`btn btn-of-light ${displayedAs === displayAs.checkbox ? 'active': ''}`}
                                onClick={() => putNodeDefProp(nodeDef, 'displayAs', displayAs.checkbox)}>
                          Checkbox
                        </button>
                      </div>
                    </FormItem>
                    <FormItem label={'Parent Code'}>
                      <Dropdown disabled={!parentCodeAvailable}
                                items={possibleParentCodeItems}
                                selection={selectedParentCode}
                                onChange={item => putNodeDefProp(nodeDef, 'parentCodeId', item.key)}/>
                    </FormItem>
                  </React.Fragment>
                  : null
              }

              {
                isNodeDefEntity(nodeDef)
                  ? null
                  : <FormItem label={'key'}>
                    <Checkbox checked={isNodeDefKey(nodeDef)}
                              onChange={(checked) => putNodeDefProp(nodeDef, 'key', checked)}/>
                  </FormItem>
              }


              {
                canNodeDefBeMultiple(nodeDef)
                  ? <FormItem label={'multiple'}>
                    <Checkbox checked={isNodeDefMultiple(nodeDef)}
                              disabled={isRenderTable(nodeDef)}
                              onChange={(checked) => putNodeDefProp(nodeDef, 'multiple', checked)}/>
                  </FormItem>
                  : null
              }

            </React.Fragment>
    )
  }
}

export default connect(null, {putNodeDefProp, addCodeList})(CommonProps)