import React from 'react'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as InputMasks from '@webapp/components/form/inputMasks'

import NodeDefEntitySwitch from './components/types/nodeDefEntitySwitch'
import NodeDefFile from './components/types/nodeDefFile'
import NodeDefTaxon from './components/types/nodeDefTaxon'
import NodeDefCoordinate from './components/types/nodeDefCoordinate'
import NodeDefCode from './components/types/nodeDefCode'
import NodeDefBoolean from './components/types/nodeDefBoolean'
import NodeDefText from './components/types/nodeDefText'

const { integer, decimal, text, date, time, boolean, code, coordinate, taxon, file, entity } = NodeDef.nodeDefType

const propsUI = {
  [integer]: {
    icon: <span className="icon-left node_def__icon">123</span>,
    inputText: {
      mask: InputMasks.integerLimited(16),
    },
    defaultValue: '',
  },

  [decimal]: {
    icon: <span className="icon-left node_def__icon">1.23</span>,
    inputText: {
      mask: InputMasks.decimalLimited(16, 6),
    },
    defaultValue: '',
  },

  [text]: {
    icon: (
      <span className="icon-left display-flex">
        {R.range(0, 3).map((i) => (
          <span key={i} className="icon icon-text-color" style={{ margin: '0 -3px' }} />
        ))}
      </span>
    ),
    defaultValue: '',
  },

  [date]: {
    icon: <span className="icon icon-calendar icon-left" />,
    inputText: {
      mask: [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/],
      showMask: true,
      placeholderChar: '\u2000',
    },
    defaultValue: '',
  },

  [time]: {
    icon: <span className="icon icon-clock icon-left" />,
    inputText: {
      mask: [/\d/, /\d/, ':', /\d/, /\d/],
      showMask: true,
      placeholderChar: '\u2000',
    },
    defaultValue: '',
  },

  [boolean]: {
    component: NodeDefBoolean,
    icon: <span className="icon icon-radio-checked2 icon-left" />,
    defaultValue: '',
  },

  [code]: {
    component: NodeDefCode,
    icon: <span className="icon icon-list icon-left" />,
    defaultValue: '',
    defaultProps: (cycle) => ({
      [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.checkbox),
    }),
  },

  [coordinate]: {
    component: NodeDefCoordinate,
    icon: <span className="icon icon-location2 icon-left" />,
    defaultValue: { x: '', y: '', srs: '' },
    formFields: [
      { field: 'x', labelKey: 'surveyForm.nodeDefCoordinate.x' },
      { field: 'y', labelKey: 'surveyForm.nodeDefCoordinate.y' },
      { field: 'srs', labelKey: 'common.srs' },
    ],
  },

  [taxon]: {
    component: NodeDefTaxon,
    icon: <span className="icon icon-leaf icon-left" />,
    defaultValue: {
      taxonUuid: null,
      vernacularNameUuid: null,
    },
    formFields: [
      { field: 'code', labelKey: 'common.code' },
      {
        field: 'scientific_name',
        labelKey: 'surveyForm.nodeDefTaxon.scientificName',
      },
      {
        field: 'vernacular_name',
        labelKey: 'surveyForm.nodeDefTaxon.vernacularName',
      },
    ],
  },

  [file]: {
    component: NodeDefFile,
    icon: <span className="icon icon-file-picture icon-left" />,
    validations: false,
  },

  [entity]: {
    component: NodeDefEntitySwitch,
    icon: <span className="icon icon-table2 icon-left" />,
    defaultProps: (cycle) => ({
      [NodeDef.propKeys.multiple]: true,
      [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.table),
    }),
  },
}

const getPropByType = (prop, defaultValue = null) => (nodeDefType) =>
  R.pathOr(defaultValue, [nodeDefType, prop], propsUI)

const getProp = (prop, defaultValue) => R.pipe(NodeDef.getType, getPropByType(prop, defaultValue))

export const getIconByType = getPropByType('icon')

export const getInputTextProps = getProp('inputText', { mask: false })

export const getComponent = getProp('component', NodeDefText)

export const getFormFields = getProp('formFields', ['field'])

export const getDefaultValue = getProp('defaultValue')

export const getValidationsEnabledByType = getPropByType('validations', true)

export const getDefaultPropsByType = (type, cycle) => {
  const fn = getPropByType('defaultProps')(type)
  return fn ? fn(cycle) : {}
}
