import React from 'react'

import { getSurveyDefaultLanguage } from '../../../../../common/survey/survey'
import { getNodeDefLabel } from '../../../../../common/survey/nodeDef'

import { FormItem } from '../../../../commonComponents/form/input'

class NodeDefFormItem extends React.Component {

  render () {
    const {survey, nodeDef, children} = this.props
    const lang = getSurveyDefaultLanguage(survey)

    return (
      <FormItem label={getNodeDefLabel(nodeDef, lang)}>
        {children}
      </FormItem>
    )
  }
}

export default NodeDefFormItem
