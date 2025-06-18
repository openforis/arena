import React from 'react'
import * as R from 'ramda'

import { FormHeaderColor } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import { valuePropsCoordinate, valuePropsTaxon } from '@core/survey/nodeValueProps'

import { NumberFormats } from '@webapp/components/form/Input'

import NodeDefBoolean from './components/types/nodeDefBoolean'
import NodeDefCode from './components/types/NodeDefCode'
import NodeDefCoordinate from './components/types/nodeDefCoordinate'
import NodeDefDate from './components/types/nodeDefDate'
import NodeDefEntitySwitch from './components/types/nodeDefEntitySwitch'
import NodeDefFile from './components/types/nodeDefFile'
import NodeDefFormHeader from './components/types/nodeDefFormHeader'
import NodeDefTaxon from './components/types/nodeDefTaxon'
import NodeDefText from './components/types/nodeDefText'
import NodeDefTime from './components/types/nodeDefTime'
import NodeDefGeo from './components/types/nodeDefGeo'

const { boolean, code, coordinate, date, decimal, entity, file, formHeader, geo, integer, taxon, text, time } =
  NodeDef.nodeDefType

export const headerColorRgbCodesByColor = {
  [FormHeaderColor.blue]: '#b3e5fc',
  [FormHeaderColor.green]: '#b2dfdb',
  [FormHeaderColor.orange]: '#ffb38a',
  [FormHeaderColor.red]: '#f97c7c',
  [FormHeaderColor.yellow]: '#fffdaf',
}

const singleEntityIcon = <span className="icon icon-insert-template icon-left" />
const multipleAttributeIcon = <span title="Multiple">M</span>
const keyIcon = <span className="icon icon-key icon-left" />

const propsUI = {
  [integer]: {
    icon: <span className="icon-left node_def__icon">123</span>,
    numberFormat: NumberFormats.integer(),
    defaultValue: '',
  },

  [decimal]: {
    icon: <span className="icon-left node_def__icon">1.23</span>,
    numberFormat: NumberFormats.decimal(),
    defaultValue: '',
  },

  [text]: {
    icon: <span className="icon-left node_def__icon">ABC</span>,
    defaultValue: '',
  },

  [date]: {
    component: NodeDefDate,
    icon: <span className="icon icon-calendar icon-left" />,
    defaultValue: '',
  },

  [time]: {
    component: NodeDefTime,
    icon: <span className="icon icon-clock icon-left" />,
    defaultValue: '',
  },

  [boolean]: {
    component: NodeDefBoolean,
    icon: <span className="icon icon-checkbox-checked icon-left" />,
    defaultValue: '',
  },

  [code]: {
    component: NodeDefCode,
    icon: <span className="icon icon-list icon-left" />,
    defaultValue: '',
    defaultProps: (cycle) => ({
      [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.dropdown),
    }),
  },

  [coordinate]: {
    component: NodeDefCoordinate,
    icon: <span className="icon icon-location2 icon-left" />,
    defaultValue: { x: '', y: '', srs: '' },
    formFieldsFn: (nodeDef) => [
      { field: valuePropsCoordinate.x, labelKey: 'surveyForm:nodeDefCoordinate.x' },
      { field: valuePropsCoordinate.y, labelKey: 'surveyForm:nodeDefCoordinate.y' },
      { field: valuePropsCoordinate.srs, labelKey: 'common.srs' },
      ...NodeDef.getCoordinateAdditionalFields(nodeDef).map((field) => ({
        field,
        labelKey: `surveyForm:nodeDefCoordinate.${field}`,
      })),
    ],
  },

  [geo]: {
    component: NodeDefGeo,
    icon: <span className="icon icon-codepen icon-left" />,
  },

  [taxon]: {
    component: NodeDefTaxon,
    icon: <span className="icon icon-leaf icon-left" />,
    defaultValue: {
      taxonUuid: null,
      vernacularNameUuid: null,
    },
    formFieldsFn: () => [
      { field: valuePropsTaxon.code, labelKey: 'common.code', tableColumnFlex: 2 },
      {
        field: valuePropsTaxon.scientificName,
        labelKey: 'surveyForm:nodeDefTaxon.scientificName',
        tableColumnFlex: 5,
      },
      {
        field: valuePropsTaxon.vernacularName,
        labelKey: 'surveyForm:nodeDefTaxon.vernacularName',
        tableColumnFlex: 3,
      },
    ],
  },

  [file]: {
    component: NodeDefFile,
    icon: <span className="icon icon-file-picture icon-left" />,
    validations: true,
  },

  [entity]: {
    component: NodeDefEntitySwitch,
    icon: <span className="icon icon-table2 icon-left" />,
    defaultProps: (cycle) => ({
      [NodeDef.propKeys.multiple]: true,
      [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.table),
    }),
  },

  [formHeader]: {
    component: NodeDefFormHeader,
    icon: <span className="icon icon-minus icon-left" />,
    defaultProps: () => ({
      [NodeDef.propKeys.headerColor]: FormHeaderColor.blue,
    }),
  },
}

const getPropByType =
  (prop, defaultValue = null) =>
  (nodeDefType) =>
    R.pathOr(defaultValue, [nodeDefType, prop], propsUI)

const getProp = (prop, defaultValue = null) => R.pipe(NodeDef.getType, getPropByType(prop, defaultValue))

export const getIconByType = getPropByType('icon')

export const getIconByNodeDef = (nodeDef, includeKey = false) => (
  <div className="node-def__icon-wrapper">
    {includeKey && NodeDef.isKey(nodeDef) && keyIcon}
    {NodeDef.isMultipleAttribute(nodeDef) && multipleAttributeIcon}
    {NodeDef.isSingleEntity(nodeDef) ? singleEntityIcon : getIconByType(NodeDef.getType(nodeDef))}
  </div>
)

export const getNumberFormat = (nodeDef) =>
  NodeDef.isDecimal(nodeDef)
    ? NumberFormats.decimal({ decimalScale: NodeDef.getMaxNumberDecimalDigits(nodeDef) })
    : getProp('numberFormat')(nodeDef)

export const getComponent = getProp('component', NodeDefText)

export const getFormFields = (nodeDef) => {
  const getFieldsFn = getProp('formFieldsFn')(nodeDef)
  return getFieldsFn ? getFieldsFn(nodeDef) : ['field']
}

export const getFormFieldsLength = (nodeDef) => getFormFields(nodeDef).length

export const getTableColumnFlex = (field) => (nodeDef) => {
  const formFields = getFormFields(nodeDef)
  const formField = formFields.find((formField) => formField.field === field)
  return formField?.tableColumnFlex || 1
}

export const getDefaultValue = getProp('defaultValue')

export const getValidationsEnabledByType = getPropByType('validations', true)

export const getDefaultPropsByType = (type, cycle) => {
  const fn = getPropByType('defaultProps')(type)
  return fn ? fn(cycle) : {}
}
