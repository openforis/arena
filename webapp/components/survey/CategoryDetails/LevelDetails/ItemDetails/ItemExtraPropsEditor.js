import React from 'react'
import PropTypes from 'prop-types'

import { Numbers, Objects, Points } from '@openforis/arena-core'

import * as A from '@core/arena'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'

import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import SrsDropdown from '@webapp/components/survey/SrsDropdown'
import { useI18n } from '@webapp/store/system'
import { useSurveySrsIndex } from '@webapp/store/survey'

const pointNumericFields = ['x', 'y']

const parsePoint = ({ value, srsIndex }) => {
  const srssArray = Object.values(srsIndex)
  const surveyDefaultSrs = srssArray.length > 0 ? srssArray[0] : null
  const surveyDefaultSrsCode = surveyDefaultSrs?.code
  const point = Points.parse(value) ?? {}
  // assing default (first) srs if missing in parsed point
  point.srs = point.srs ?? surveyDefaultSrsCode
  return point
}

const GeometryPointExtraPropEditor = (props) => {
  const { extraPropKey, item, readOnly, updateProp, validation } = props

  const srsIndex = useSurveySrsIndex()

  const value = CategoryItem.getExtraProp(extraPropKey)(item)

  const point = parsePoint({ value, srsIndex })
  const { x, y, srs } = point

  const onFieldChange = (field) => (value) => {
    let pointUpdated = { ...point, [field]: pointNumericFields.includes(field) ? Numbers.toNumber(value) : value }
    if (Objects.isEmpty(pointUpdated.x) && Objects.isEmpty(pointUpdated.y)) {
      pointUpdated = null
    }
    const extra = A.pipe(CategoryItem.getExtra, A.assoc(extraPropKey, pointUpdated))(item)
    updateProp({ key: CategoryItem.keysProps.extra, value: extra })
  }

  return (
    <FormItem label={extraPropKey}>
      <div className="geometry-point-form-item-content">
        <FormItem label="X">
          <Input
            value={x}
            numberFormat={NumberFormats.decimal()}
            readOnly={readOnly}
            validation={Validation.getFieldValidation(`${CategoryItem.keysProps.extra}_${extraPropKey}`)(validation)}
            onChange={onFieldChange('x')}
          />
        </FormItem>
        <FormItem label="Y">
          <Input
            value={y}
            numberFormat={NumberFormats.decimal()}
            readOnly={readOnly}
            validation={Validation.getFieldValidation(`${CategoryItem.keysProps.extra}_${extraPropKey}`)(validation)}
            onChange={onFieldChange('y')}
          />
        </FormItem>
        <FormItem label="SRS">
          <SrsDropdown
            onChange={(selection) => onFieldChange('srs')(selection?.code)}
            readOnly={readOnly}
            selectedSrsCode={srs}
          />
        </FormItem>
      </div>
    </FormItem>
  )
}

GeometryPointExtraPropEditor.propTypes = {
  extraPropKey: PropTypes.string.isRequired,
  item: PropTypes.object,
  readOnly: PropTypes.bool,
  updateProp: PropTypes.func.isRequired,
  validation: PropTypes.object,
}

const extraPropValueToInputValue = (value) => {
  if (A.isEmpty(value)) {
    return ''
  }
  return typeof value === 'object' ? JSON.stringify(value) : value
}

export const ItemExtraPropsEditor = (props) => {
  const { item, itemExtraDefsArray, readOnly, updateProp, validation } = props

  const i18n = useI18n()

  return (
    <fieldset className="extra-props">
      <legend>{i18n.t('extraProp.label_plural')}</legend>
      {itemExtraDefsArray.map(({ dataType, name: key }) =>
        dataType === ExtraPropDef.dataTypes.geometryPoint ? (
          <GeometryPointExtraPropEditor
            key={key}
            extraPropKey={key}
            item={item}
            readOnly={readOnly}
            updateProp={updateProp}
            validation={validation}
          />
        ) : (
          <FormItem label={key} key={key}>
            <Input
              value={extraPropValueToInputValue(CategoryItem.getExtraProp(key)(item))}
              numberFormat={dataType === ExtraPropDef.dataTypes.number ? NumberFormats.decimal() : null}
              readOnly={readOnly}
              validation={Validation.getFieldValidation(`${CategoryItem.keysProps.extra}_${key}`)(validation)}
              onChange={(value) => {
                const extra = A.pipe(CategoryItem.getExtra, A.assoc(key, value))(item)
                updateProp({ key: CategoryItem.keysProps.extra, value: extra })
              }}
            />
          </FormItem>
        )
      )}
    </fieldset>
  )
}

ItemExtraPropsEditor.propTypes = {
  item: PropTypes.object,
  itemExtraDefsArray: PropTypes.array.isRequired,
  readOnly: PropTypes.bool,
  updateProp: PropTypes.func.isRequired,
  validation: PropTypes.object,
}
