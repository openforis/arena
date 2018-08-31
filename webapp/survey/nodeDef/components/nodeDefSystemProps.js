import React from 'react'
import * as R from 'ramda'
import createNumberMask from 'text-mask-addons/dist/createNumberMask'

import { nodeDefType } from '../../../../common/survey/nodeDef'

import NodeDefEntity from './types/nodeDefEntity'
import NodeDefFile from './types/nodeDefFile'
import NodeDefTaxon from './types/nodeDefTaxon'
import NodeDefCoordinate from './types/nodeDefCoordinate'
import NodeDefCodeList from './types/nodeDefCodeList'
import NodeDefBoolean from './types/nodeDefBoolean'
import NodeDefText from './types/nodeDefText'

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
        decimalLimit: 4,
        integerLimit: 16,
        requireDecimal: false,
        allowNegative: true,
        allowLeadingZeroes: true,
      }),
    },
  },

  [nodeDefType.text]: {
    icon: <span className="icon-left">{R.range(0, 3).map(i =>
      <span key={i} className="icon icon-text-color" style={{margin: '0 -3px'}}/>
    )}</span>,
  },

  [nodeDefType.date]: {
    icon: <span className="icon icon-calendar icon-left"/>,
    inputText: {
      mask: [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/],
      showMask: true,
      placeholderChar: '\u2000',
    }
  },

  [nodeDefType.time]: {
    icon: <span className="icon icon-clock icon-left"/>,
    inputText: {
      mask: [/\d/, /\d/, ':', /\d/, /\d/],
      showMask: true,
      placeholderChar: '\u2000',
    }
  },

  [nodeDefType.boolean]: {
    component: NodeDefBoolean,
    icon: <span className="icon icon-radio-checked2 icon-left"/>,
  },

  [nodeDefType.codeList]: {
    component: NodeDefCodeList,
    icon: <span className="icon icon-list icon-left"/>,
  },

  [nodeDefType.coordinate]: {
    component: NodeDefCoordinate,
    icon: <span className="icon icon-location2 icon-left"/>,
  },

  [nodeDefType.taxon]: {
    component: NodeDefTaxon,
    icon: <span className="icon icon-leaf icon-left"/>,
  },

  [nodeDefType.file]: {
    component: NodeDefFile,
    icon: <span className="icon icon-file-picture icon-left"/>,
  },

  [nodeDefType.entity]: {
    component: NodeDefEntity,
    icon: <span className="icon icon-table2 icon-left"/>,
  },

}

const getProp = (nodeDefType, prop) => R.path([nodeDefType, prop])

export const getNodeDefIconByType = nodeDefType => R.pipe(
  getProp(nodeDefType, 'icon'),
)(nodeDefSystemProps)

export const getNodeDefInputTextProps = nodeDef => R.pipe(
  getProp(nodeDef.type, 'inputText'),
  R.defaultTo({mask: false, showMask: false}),
)(nodeDefSystemProps)

export const getNodeDefComponent = nodeDef => R.pipe(
  getProp(nodeDef.type, 'component'),
  R.defaultTo(NodeDefText),
)(nodeDefSystemProps)