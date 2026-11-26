import { cloneElement, isValidElement } from 'react'

import { FormHeaderColor } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import { valuePropsCoordinate, valuePropsTaxon } from '@core/survey/nodeValueProps'
import { AppIcon } from '@webapp/components/AppIcon'
import { NumberFormats } from '@webapp/components/form/Input'

import NodeDefBoolean from './components/types/NodeDefBoolean'
import NodeDefCode from './components/types/NodeDefCode'
import NodeDefCoordinate from './components/types/NodeDefCoordinate'
import NodeDefDate from './components/types/NodeDefDate'
import NodeDefEntitySwitch from './components/types/NodeDefEntitySwitch'
import NodeDefFile from './components/types/NodeDefFile'
import NodeDefFormHeader from './components/types/NodeDefFormHeader'
import NodeDefGeo from './components/types/NodeDefGeo'
import NodeDefTaxon from './components/types/NodeDefTaxon'
import NodeDefText from './components/types/NodeDefText'
import NodeDefTime from './components/types/NodeDefTime'

const { boolean, code, coordinate, date, decimal, entity, file, formHeader, geo, integer, taxon, text, time } =
  NodeDef.nodeDefType

export const headerColorRgbCodesByColor = {
  [FormHeaderColor.blue]: '#b3e5fc',
  [FormHeaderColor.green]: '#b2dfdb',
  [FormHeaderColor.orange]: '#ffb38a',
  [FormHeaderColor.red]: '#f97c7c',
  [FormHeaderColor.yellow]: '#fffdaf',
}

const singleEntityIcon = <AppIcon name="file" className="icon-left" />
const multipleAttributeIcon = <span title="Multiple">M</span>
const keyIcon = <AppIcon name="key" className="icon-left" />

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
    icon: <AppIcon name="calendar" className="icon-left" />,
    defaultValue: '',
  },

  [time]: {
    component: NodeDefTime,
    icon: <AppIcon name="time" className="icon-left" />,
    defaultValue: '',
  },

  [boolean]: {
    component: NodeDefBoolean,
    icon: <AppIcon name="checkboxChecked" className="icon-left" />,
    defaultValue: '',
  },

  [code]: {
    component: NodeDefCode,
    icon: <AppIcon name="list" className="icon-left" />,
    defaultValue: '',
    defaultProps: (cycle) => ({
      [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.dropdown),
    }),
  },

  [coordinate]: {
    component: NodeDefCoordinate,
    icon: <AppIcon name="place" className="icon-left" />,
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
    icon: <AppIcon name="geo" className="icon-left" />,
  },

  [taxon]: {
    component: NodeDefTaxon,
    icon: <AppIcon name="taxon" className="icon-left" />,
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
    icon: <AppIcon name="fileImage" className="icon-left" />,
    validations: true,
  },

  [entity]: {
    component: NodeDefEntitySwitch,
    icon: <AppIcon name="table" className="icon-left" />,
    defaultProps: (cycle) => ({
      [NodeDef.propKeys.multiple]: true,
      [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.table),
    }),
  },

  [formHeader]: {
    component: NodeDefFormHeader,
    icon: <AppIcon name="remove" className="icon-left" />,
    defaultProps: () => ({
      [NodeDef.propKeys.headerColor]: FormHeaderColor.blue,
    }),
  },
}

const getPropByType =
  (prop, defaultValue = null) =>
  (nodeDefType) =>
    A.pathOr(defaultValue, [nodeDefType, prop], propsUI)

const getProp = (prop, defaultValue = null) => A.pipe(NodeDef.getType, getPropByType(prop, defaultValue))

const getIconProp = getPropByType('icon')

// the icons are AppIcon elements (or text, e.g. "123"): a size, when given, is set on the AppIcon ones
const withSize = (icon, size?: number) =>
  size && isValidElement(icon) && icon.type === AppIcon
    ? cloneElement(icon as React.ReactElement<{ size?: number }>, { size })
    : icon

/**
 * Returns the icon of the given node definition type, optionally with the given size (px).
 */
export const getIconByType = (nodeDefType, size?: number) => withSize(getIconProp(nodeDefType), size)

const getEntityIcon = ({ nodeDef, cycle }) => {
  if (NodeDef.isRoot(nodeDef)) {
    return undefined
  }
  if (NodeDef.isSingle(nodeDef)) {
    return singleEntityIcon
  }
  // multiple entity with form layout
  if (NodeDefLayout.isRenderForm(cycle)(nodeDef)) {
    return <AppIcon name="files" className="icon-left" />
  }
  // multiple entity with table layout
  return <AppIcon name="table" className="icon-left" />
}

export const getIconByNodeDef = ({ nodeDef, cycle, includeKey = false, size = undefined }) => (
  <div className="node-def__icon-wrapper">
    {includeKey && NodeDef.isKey(nodeDef) && withSize(keyIcon, size)}
    {NodeDef.isMultipleAttribute(nodeDef) && multipleAttributeIcon}
    {NodeDef.isEntity(nodeDef)
      ? withSize(getEntityIcon({ nodeDef, cycle }), size)
      : getIconByType(NodeDef.getType(nodeDef), size)}
  </div>
)

/**
 * Extracts the CSS class name, the AppIcon name and the text content of the given icon React element.
 * Used to render the same node def type icons outside of React (e.g. in a D3 chart).
 * @param {ReactElement} element - Icon element defined in this module.
 * @returns {{className: string, iconName: string|null, text: string|null}|null} Icon descriptor, or null if no element is given.
 */
const getIconDescriptor = (element) => {
  if (!element) return null
  const { className, children, name } = element.props
  return { className, iconName: name ?? null, text: typeof children === 'string' ? children : null }
}

/**
 * Returns a plain descriptor (CSS class name and optional text content) of the icon
 * representing the type of the given node definition, for use outside of React rendering.
 * @returns {{className: string, iconName: string|null, text: string|null}|null} Icon descriptor, or null for the root entity.
 */
export const getIconDescriptorByNodeDef = ({ nodeDef, cycle }) =>
  NodeDef.isEntity(nodeDef)
    ? getIconDescriptor(getEntityIcon({ nodeDef, cycle }))
    : getIconDescriptor(getIconByType(NodeDef.getType(nodeDef)))

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
