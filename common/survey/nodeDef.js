const R = require('ramda')
const {uuidv4} = require('../uuid')

const validation = 'validation'

const {
  // getProps,
  getProp,
  getLabels,

  // setProp,
} = require('./surveyUtils')

// ======== NODE DEF PROPERTIES

const nodeDefType = {
  integer: 'integer',
  decimal: 'decimal',
  text: 'text',
  date: 'date',
  time: 'time',
  boolean: 'boolean',
  codeList: 'codeList',
  coordinate: 'coordinate',
  taxon: 'taxon',
  file: 'file',
  entity: 'entity',
}

// ==== CREATE

const newNodeDef = (surveyId, parentId, type, props) => ({
  surveyId,
  uuid: uuidv4(),
  parentId,
  type,
  props,
})

// ==== READ

const getNodeDefLabel = (nodeDef, lang) => R.pipe(
  getLabels,
  R.prop(lang),
)(nodeDef)

const getNodeDefType = R.prop('type')

const getNodeDefValidation = R.prop(validation)

const isNodeDefValid =
  R.pipe(
    getNodeDefValidation,
    R.prop('fields'),
    R.values,
    R.find (fieldValidation => R.prop('valid')(fieldValidation) !== true),
    R.isNil,
  )

// ==== UPDATE
const updateNodeDefValidation = nodeDef =>
  R.pipe(
    isNodeDefValid,
    valid => R.assocPath([validation, 'valid'], valid)(nodeDef)
  )(nodeDef)

const assocNodeDefFieldValidation = (field, v) =>
  R.pipe(
    R.assocPath([validation, 'fields', field], v),
    updateNodeDefValidation,
  )

module.exports = {
  //READ
  nodeDefType,
  getNodeDefType,
  getNodeDefValidation,
  isNodeDefValid,

  //UPDATE
  assocNodeDefValidation: v => R.assoc(validation, v),
  assocNodeDefFieldValidation,

  isNodeDefEntity: R.pipe(getNodeDefType, R.equals(nodeDefType.entity)),
  isNodeDefMultiple: R.pipe(getProp('multiple'), R.equals(true)),

// props
//   getNodeDefProps: getProps,
  getNodeDefProp: getProp,
//   setNodeDefProp: setProp,
  getNodeDefLabels: getLabels,
  getNodeDefDescriptions: getProp('descriptions', {}),
  getNodeDefLabel,

  //CREATE
  newNodeDef,
}
