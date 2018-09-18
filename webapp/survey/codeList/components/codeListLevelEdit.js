import React from 'react'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListItemEdit from './codeListItemEdit'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getSurveyCodeListById } from '../../../../common/survey/survey'
import { getCodeListLevelName, newCodeListItem, getCodeListItemsByParentId } from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

import { addCodeListItem, putCodeListLevelProp } from '../../codeList/actions'
import { getSurvey } from '../../surveyState'


class CodeListLevelEdit extends React.Component {

  addNewItem () {
    const {level, parentItem, addCodeListItem} = this.props
    const {codeListId} = level
    const item = newCodeListItem(level.id, parentItem ? parentItem.id : null)
    addCodeListItem(codeListId, item)
  }

  render () {
    const {level, items, putCodeListLevelProp} = this.props

    const validation = {} //TODO

    return <div>
      <h2>LEVEL {level.index + 1}</h2>

      <FormItem label={'name'}>
        <Input value={getCodeListLevelName(level)}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putCodeListLevelProp(level.codeListId, level.uuid, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      <h3>Items</h3>

      <button className="btn btn-s btn-of-light-xs"
              style={{marginLeft: '50px'}}
              onClick={() => this.addNewItem()}>
        <span className="icon icon-plus icon-16px icon-left"/>
        ADD
      </button>

      {
        items.map(item => <CodeListItemEdit key={item.uuid}
                                            level={level}
                                            item={item}/>)
      }
    </div>
  }
}


const mapStateToProps = (state, props) => {
  const { level, parentId } = props
  const { codeListId } = level

  const survey = getSurvey(state)
  const codeList = getSurveyCodeListById(codeListId)(survey)

  return {
    survey,
    items: getCodeListItemsByParentId(parentId)(codeList)
  }
}

export default connect(mapStateToProps, {addCodeListItem, putCodeListLevelProp})(CodeListLevelEdit)

