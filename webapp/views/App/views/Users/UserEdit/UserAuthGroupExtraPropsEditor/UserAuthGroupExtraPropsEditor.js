import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as User from '@core/user/user'

import { ExpansionPanel } from '@webapp/components'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

import { useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

export const UserAuthGroupExtraPropsEditor = (props) => {
  const { onChange, userToUpdate } = props

  const canEditSurvey = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()

  const extraDefsArray = useMemo(() => Survey.getUserExtraPropDefsArray(surveyInfo), [surveyInfo])

  const extraOld = User.getAuthGroupExtraProps(userToUpdate)

  const onInputFieldChange = useCallback(
    (propName) => (value) => {
      const extraUpdated = { ...extraOld }
      if (Objects.isEmpty(value)) {
        delete extraUpdated[propName]
      } else {
        extraUpdated[propName] = value
      }
      onChange(extraUpdated)
    },
    [extraOld, onChange]
  )

  if (extraDefsArray.length === 0) return null

  const readOnly = !canEditSurvey

  return (
    <ExpansionPanel
      buttonLabel="usersView.surveyExtraProp.label_other"
      className="extra-props"
      startClosed={Objects.isEmpty(extraOld)}
    >
      {extraDefsArray.map(({ name, dataType }) => (
        <FormItem label={name} key={name}>
          <Input
            value={User.getAuthGroupExtraProp(name)(userToUpdate)}
            numberFormat={dataType === ExtraPropDef.dataTypes.number ? NumberFormats.decimal() : null}
            readOnly={readOnly}
            onChange={onInputFieldChange(name)}
          />
        </FormItem>
      ))}
    </ExpansionPanel>
  )
}

UserAuthGroupExtraPropsEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  userToUpdate: PropTypes.object.isRequired,
}
