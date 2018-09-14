import React from 'react'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'

import { getCodeListName } from '../../../../common/survey/codeList'
import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getFieldValidation } from '../../../../common/validation/validator'

import { putCodeListProp } from '../../actions'
import CodeListLevel from './codeListLevel'

class CodeListEdit extends React.Component {

  render () {
    const { codeList, putCodeListProp } = this.props
    const { levels, validation } = codeList


    return <div>

      <FormItem label={'name'}>
        <Input value={getCodeListName(codeList)}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putCodeListProp(codeList.uuid, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      {
        levels.map(level => <CodeListLevel level={level}/>)
      }

    </div>
  }

}

export default connect(null, {putCodeListProp})(CodeListEdit)