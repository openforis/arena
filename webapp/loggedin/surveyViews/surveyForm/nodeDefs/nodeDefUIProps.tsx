import React, { ReactElement } from 'react'
import * as R from 'ramda'
import createNumberMask from 'text-mask-addons/dist/createNumberMask'

import NodeDef, { INodeDef, NodeDefType } from '../../../../../core/survey/nodeDef'
import NodeDefLayout from '../../../../../core/survey/nodeDefLayout'

import { NodeDefEntitySwitch } from './internal'
import { NodeDefFile } from './internal'
import { NodeDefTaxon } from './internal'
import { NodeDefCoordinate } from './internal'
import { NodeDefCode } from './internal'
import { NodeDefBoolean } from './internal'
import { NodeDefText } from './internal'


type PropDef = {
  icon: ReactElement;
  inputText?: any;
  component?: () => any; // This gets around the problem of cyclic dependencies
  defaultValue?: string | { [s: string]: any; }
  defaultProps?: (x: any) => { [s: string]: any; }
  formFields?: { field: string; labelKey: string; }[];
}
type PropsUI = {
  [K in NodeDefType]: PropDef;
}

const propsUI: PropsUI = {
  integer: {
    icon: <span className="icon-left node_def__icon">923</span>,
    inputText: {
      mask: createNumberMask({
        prefix: '',
        suffix: '',
        includeThousandsSeparator: false,
        thousandsSeparatorSymbol: ',',
        allowDecimal: false,
        decimalSymbol: '.',
        decimalLimit: 0,
        integerLimit: 16,
        requireDecimal: false,
        allowNegative: true,
        allowLeadingZeroes: true,
      }),
    },
    defaultValue: '',
  },

  decimal: {
    icon: <span className="icon-left node_def__icon">923,4</span>,
    inputText: {
      mask: createNumberMask({
        prefix: '',
        suffix: '',
        includeThousandsSeparator: false,
        thousandsSeparatorSymbol: ',',
        allowDecimal: true,
        decimalSymbol: '.',
        decimalLimit: 6,
        integerLimit: 16,
        requireDecimal: false,
        allowNegative: true,
        allowLeadingZeroes: true,
      }),
    },
    defaultValue: '',
  },

  text: {
    icon: <span className="icon-left display-flex">{R.range(0, 3).map(i =>
      <span key={i} className="icon icon-text-color" style={{ margin: '0 -3px' }}/>
    )}</span>,
    defaultValue: '',
  },

  date: {
    icon: <span className="icon icon-calendar icon-left"/>,
    inputText: {
      mask: [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/],
      showMask: true,
      placeholderChar: '\u2000',
    },
    defaultValue: '',
  },

  time: {
    icon: <span className="icon icon-clock icon-left"/>,
    inputText: {
      mask: [/\d/, /\d/, ':', /\d/, /\d/],
      showMask: true,
      placeholderChar: '\u2000',
    },
    defaultValue: '',
  },

  boolean: {
    component: () => NodeDefBoolean,
    icon: <span className="icon icon-radio-checked2 icon-left"/>,
    defaultValue: '',
  },

  code: {
    component: () => NodeDefCode,
    icon: <span className="icon icon-list icon-left"/>,
    defaultValue: '',
    defaultProps: cycle => ({
      [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.checkbox)
    }),
  },

  coordinate: {
    component: () => NodeDefCoordinate,
    icon: <span className="icon icon-location2 icon-left"/>,
    defaultValue: { x: '', y: '', srs: '' },
    formFields: [
      { field: 'x', labelKey: 'surveyForm.nodeDefCoordinate.x' },
      { field: 'y', labelKey: 'surveyForm.nodeDefCoordinate.y' },
      { field: 'srs', labelKey: 'common.srs' },
    ],
  },

  taxon: {
    component: () => NodeDefTaxon,
    icon: <span className="icon icon-leaf icon-left"/>,
    defaultValue: {
      taxonUuid: null,
      vernacularNameUuid: null,
    },
    formFields: [
      { field: 'code', labelKey: 'common.code' },
      { field: 'scientific_name', labelKey: 'surveyForm.nodeDefTaxon.scientificName' },
      { field: 'vernacular_name', labelKey: 'surveyForm.nodeDefTaxon.vernacularName' },
    ],
  },

  file: {
    component: () => NodeDefFile,
    icon: <span className="icon icon-file-picture icon-left"/>,
  },

  entity: {
    component: () => NodeDefEntitySwitch,
    icon: <span className="icon icon-table2 icon-left"/>,
    defaultProps: cycle => ({
      [NodeDef.propKeys.multiple]: true,
      [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.table)
    }),
  },
}

const getPropByType = (prop, defaultValue?) => nodeDefType => R.pathOr(defaultValue, [nodeDefType, prop], propsUI)

const getProp = (prop, defaultValue?) => R.pipe(NodeDef.getType, getPropByType(prop, defaultValue))

export const getIconByType = getPropByType('icon')

export const getInputTextProps = getProp('inputText', { mask: false })

export const getComponent: (nodeDef: INodeDef) => any
= nodeDef => {
  const propDef: PropDef = propsUI[nodeDef.type];
  return propDef.component ? propDef.component() : NodeDefText;
}

export const getFormFields = getProp('formFields', ['field'])

export const getDefaultValue = getProp('defaultValue')

export const getDefaultPropsByType = (type, cycle) => {
  const fn = getPropByType('defaultProps')(type)
  return fn ? fn(cycle) : {}
}

export const NodeDefUIProps = {
  getIconByType,
  getInputTextProps,
  getComponent,
  getFormFields,
  getDefaultValue,
  getDefaultPropsByType,
}
