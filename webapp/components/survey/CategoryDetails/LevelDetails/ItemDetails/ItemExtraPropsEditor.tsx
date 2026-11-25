import { type ArenaCategoryItem, type ArenaValidation, Numbers, Objects, Points } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as CategoryItem from '@core/survey/categoryItem'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Validation from '@core/validation/validation'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import SrsDropdown from '@webapp/components/survey/SrsDropdown'
import { useSurveySrsIndex } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const pointNumericFields = new Set(['x', 'y'])

type ParsedPoint = { x?: number | string; y?: number | string; srs?: string }

const parsePoint = ({ value, srsIndex }): ParsedPoint => {
  const srssArray = Object.values(srsIndex) as { code: string }[]
  const surveyDefaultSrs = srssArray.length > 0 ? srssArray[0] : null
  const surveyDefaultSrsCode = surveyDefaultSrs?.code
  const point: ParsedPoint = Points.parse(value) ?? {}
  // assing default (first) srs if missing in parsed point
  point.srs = point.srs ?? surveyDefaultSrsCode
  return point
}

type GeometryPointExtraPropEditorProps = {
  extraPropKey: string
  item?: ArenaCategoryItem
  readOnly?: boolean
  updateProp: (...args: any[]) => any
  validation?: ArenaValidation
}

const GeometryPointExtraPropEditor = (props: GeometryPointExtraPropEditorProps) => {
  const { extraPropKey, item, readOnly, updateProp, validation } = props

  const srsIndex = useSurveySrsIndex()

  const value = CategoryItem.getExtraProp(extraPropKey)(item)

  const point = parsePoint({ value, srsIndex })
  const { x, y, srs } = point

  const onFieldChange = (field) => (value) => {
    let pointUpdated = { ...point, [field]: pointNumericFields.has(field) ? Numbers.toNumber(value) : value }
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

const extraPropValueToInputValue = (value) => {
  if (A.isEmpty(value)) {
    return ''
  }
  return typeof value === 'object' ? JSON.stringify(value) : value
}

type ItemExtraPropsEditorProps = {
  item?: ArenaCategoryItem
  itemExtraDefsArray: any[]
  readOnly?: boolean
  updateProp: (...args: any[]) => any
  validation?: ArenaValidation
}

export const ItemExtraPropsEditor = (props: ItemExtraPropsEditorProps) => {
  const { item, itemExtraDefsArray, readOnly, updateProp, validation } = props

  const i18n = useI18n()

  return (
    <fieldset className="extra-props">
      <legend>{i18n.t('extraProp.label_other')}</legend>
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
