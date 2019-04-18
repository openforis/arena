import React from 'react'
import * as R from 'ramda'
import createNumberMask from 'text-mask-addons/dist/createNumberMask'

import NodeDef from '../../../../../common/survey/nodeDef'

import NodeDefEntitySwitch from './components/types/nodeDefEntitySwitch'
import NodeDefFile from './components/types/nodeDefFile'
import NodeDefTaxon from './components/types/nodeDefTaxon'
import NodeDefCoordinate from './components/types/nodeDefCoordinate'
import NodeDefCode from './components/types/nodeDefCode'
import NodeDefBoolean from './components/types/nodeDefBoolean'
import NodeDefText from './components/types/nodeDefText'

import {
  nodeDefLayoutProps,
  nodeDefRenderType,
} from '../../../../../common/survey/nodeDefLayout'

const {nodeDefType} = NodeDef

export const nodeDefSystemProps = {
  [nodeDefType.integer]: {
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

  [nodeDefType.decimal]: {
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

  [nodeDefType.text]: {
    icon: <span className="icon-left">{R.range(0, 3).map(i =>
      <span key={i} className="icon icon-text-color" style={{margin: '0 -3px'}}/>
    )}</span>,
    defaultValue: '',
  },

  [nodeDefType.date]: {
    icon: <span className="icon icon-calendar icon-left"/>,
    inputText: {
      mask: [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/],
      showMask: true,
      placeholderChar: '\u2000',
    },
    defaultValue: ''
  },

  [nodeDefType.time]: {
    icon: <span className="icon icon-clock icon-left"/>,
    inputText: {
      mask: [/\d/, /\d/, ':', /\d/, /\d/],
      showMask: true,
      placeholderChar: '\u2000',
    },
    defaultValue: '',
  },

  [nodeDefType.boolean]: {
    component: NodeDefBoolean,
    icon: <span className="icon icon-radio-checked2 icon-left"/>,
    defaultValue: '',
  },

  [nodeDefType.code]: {
    component: NodeDefCode,
    icon: <span className="icon icon-list icon-left"/>,
    defaultValue: '',
    defaultLayoutProps: {[nodeDefLayoutProps.render]: nodeDefRenderType.checkbox},
  },

  [nodeDefType.coordinate]: {
    component: NodeDefCoordinate,
    icon: <span className="icon icon-location2 icon-left"/>,
    defaultValue: {x: '', y: '', srs: ''},
    formFields: ['x', 'y', 'srs'],
  },

  [nodeDefType.taxon]: {
    component: NodeDefTaxon,
    icon: <span className="icon icon-leaf icon-left"/>,
    defaultValue: {
      taxonUuid: null,
      vernacularNameUuid: null,
    },
    formFields: ['code', 'scientific_name', 'vernacular_name'],
  },

  [nodeDefType.file]: {
    component: NodeDefFile,
    icon: <span className="icon icon-file-picture icon-left"/>,
  },

  [nodeDefType.entity]: {
    component: NodeDefEntitySwitch,
    icon: <span className="icon icon-table2 icon-left"/>,
    defaultLayoutProps: {[nodeDefLayoutProps.render]: nodeDefRenderType.table, multiple: true}
  },

}

const getProp = (nodeDefType, prop, defaultValue = null) => R.pathOr(defaultValue, [nodeDefType, prop])

export const getNodeDefIconByType = nodeDefType => R.pipe(
  getProp(nodeDefType, 'icon'),
)(nodeDefSystemProps)

export const getNodeDefInputTextProps = nodeDef =>
  getProp(
    nodeDef.type,
    'inputText',
    {mask: false, showMask: false}
  )(nodeDefSystemProps)

export const getNodeDefComponent = nodeDef =>
  getProp(
    nodeDef.type,
    'component',
    NodeDefText
  )(nodeDefSystemProps)

export const getNodeDefFormFields = nodeDef =>
  getProp(
    nodeDef.type,
    'formFields',
    ['field']
  )(nodeDefSystemProps)

export const getNodeDefDefaultValue = nodeDef =>
  getProp(
    nodeDef.type,
    'defaultValue',
  )(nodeDefSystemProps)

export const getNodeDefDefaultLayoutPropsByType = type =>
  getProp(
    type,
    'defaultLayoutProps',
    {}
  )(nodeDefSystemProps)