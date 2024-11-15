import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as User from '@core/user/user'

import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

import { useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { ButtonSave } from '@webapp/components'

export const UserAuthGroupExtraPropsEditor = (props) => {
  const { onChange, onSave, userToUpdate } = props

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
    <div className="form">
      {extraDefsArray.map(({ name, dataType }) => (
        <FormItem label={name} key={name}>
          <Input
            numberFormat={dataType === ExtraPropDef.dataTypes.number ? NumberFormats.decimal() : null}
            onChange={onInputFieldChange(name)}
            readOnly={readOnly}
            value={User.getAuthGroupExtraProp(name)(userToUpdate)}
          />
        </FormItem>
      ))}
      {onSave && <ButtonSave onClick={onSave} />}
    </div>
  )
}

UserAuthGroupExtraPropsEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  userToUpdate: PropTypes.object.isRequired,
}
