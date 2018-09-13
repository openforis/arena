import React from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import * as R from 'ramda'

import { Input, FormItem } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'
import Radiobox from '../../../../commonComponents/form/radiobox'
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

import { normalizeName } from './../../../../../common/survey/surveyUtils'

import { getValidation, getFieldValidation } from './../../../../../common/validation/validator'

import { putNodeDefProp } from '../../../nodeDef/actions'

class CommonProps extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      codeLists: []
    }
  }

  async componentDidMount () {
    const {nodeDef} = this.props

    if (getNodeDefType(nodeDef) === nodeDefType.codeList) {
      const res = await axios.get(`/api/survey/${nodeDef.id}/codeLists`)
      const {codeLists} = res.data
      this.setState({
        codeLists: codeLists.map(list => {return {key: list.id, value: list.props.name}}),
      })
    }
  }

  onPropLabelsChange (nodeDef, labelItem, key, currentValue) {
    this.props.putNodeDefProp(nodeDef, key, R.assoc(labelItem.lang, labelItem.label, currentValue))
  }

  render () {
    const {nodeDef, putNodeDefProp} = this.props
    const {codeLists} = this.state

    const validation = getValidation(nodeDef)

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
      <React.Fragment>

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
                <Dropdown items={codeLists}
                          selection={selectedCodeList}
                          onChange={item => putNodeDefProp(nodeDef, 'codeListId', item.key)}/>
              </FormItem>
              <FormItem label={'Display As'}>
                <div style={{display: 'grid', gridTemplateColumns: '.1fr .1fr'}}>
                  <Radiobox label={'Dropdown'}
                            checked={displayedAs === displayAs.dropdown}
                            onChange={(checked) => checked ? putNodeDefProp(nodeDef, 'displayAs', displayAs.dropdown) : null}/>
                  <Radiobox label={'Checkbox'}
                            checked={displayedAs === displayAs.checkbox}
                            onChange={(checked) => checked ? putNodeDefProp(nodeDef, 'displayAs', displayAs.checkbox) : null}/>
                </div>
              </FormItem>
              <FormItem label={'Parent Code'}>
                <Dropdown disabled={! parentCodeAvailable}
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

export default connect(null, {putNodeDefProp})(CommonProps)