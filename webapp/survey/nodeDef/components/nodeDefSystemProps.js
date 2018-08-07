import React from 'react'
import * as R from 'ramda'

import { nodeDefType } from '../../../../common/survey/nodeDef'

export const nodeDefSystemProps = {
  [nodeDefType.integer]: {
    icon: <span className="icon-left node_def__icon">923</span>,
  },

  [nodeDefType.decimal]: {
    icon: <span className="icon-left node_def__icon">923,4</span>,
  },

  [nodeDefType.string]: {
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
  },

  [nodeDefType.boolean]: {
    icon: <span className="icon icon-radio-checked2 icon-left"/>,
  },

  [nodeDefType.codeList]: {
    icon: <span className="icon icon-list icon-left"/>,
  },

  [nodeDefType.coordinate]: {
    icon: <span className="icon icon-location2 icon-left"/>,
  },

  [nodeDefType.taxon]: {
    icon: <span className="icon icon-leaf icon-left"/>,
  },

  [nodeDefType.file]: {
    icon: <span className="icon icon-file-picture icon-left"/>,
  },

  [nodeDefType.entity]: {
    icon: <span className="icon icon-table2 icon-left"/>,
  },

}

const getProp = (nodeDefType, prop) => R.pipe(
  R.prop(nodeDefType),
  R.prop(prop),
)

export const getNodeDefIconByType = nodeDefType => R.pipe(
  getProp(nodeDefType, 'icon'),
)(nodeDefSystemProps)

export const getNodeDefInputTextProps = nodeDef => R.pipe(
  getProp(nodeDef.type, 'inputText'),
  R.defaultTo({mask: false, showMask: false}),
)(nodeDefSystemProps)