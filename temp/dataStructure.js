const {
  nodeDefType,
} = require('../common/survey/nodeDef')

const id = -1

const nodeDef = {
  id,
  uuid: null,

  dateCreated: null,
  dateModified: null,

  parentId: id,
  type: null, //nodeDefType

  props: {
    name: '',
    labels: {
      en: '',
      es: '',
    },
    descriptions: {
      en: '',
      es: '',
    },
    multiple: false,//boolean
    required: false,//boolean
    requiredIf: null,//expr
    applicableIf: null,//expr
    minCount: null,//int
    maxCount: null,//int
    codeListId: id,

    // common layout

  },

  propsDraft: {}
}

const attributeDef = {
  ...nodeDef,
  type: nodeDefType.attribute,

  props: {
    ...nodeDef.props,
    type: null,
    key: null,//boolean
    defaultValues: [
      {
        condition: '',
        value: ''
      },
    ],
    min: null,
    max: null,
    minInclusive: null,
    maxInclusive: null,
    regex: null,
    maxDistance: null,
    calculated: null, //boolean
  },

}

const entityDef = {
  ...nodeDef,
  type: nodeDefType.entity,

  props: {
    ...nodeDef.props,
    renderType: '',//entityDefRenderType.table,

    ///layout
    pageUUID: null, // uuid - if this entity renders in its own page
    render: 'form', //|| table
    layout: []// rect-grid-layout layout value
  },

}

const survey = {
  id,
  uuid: null,
  ownerId: id,

  published: false,
  draft: true,

  props: {
    name: 'name',
    labels: {
      en: '',
      es: '',
    },
  },

}

console.log(JSON.stringify(survey))

// data

const record = {
  id,
  uuid: null,
  surveyId: id,
}

const node = {
  id,
  uuid: null,
  surveyId: id,
  recordId: id,
  parentId: id,
  nodeDefId: id,
  value: {},
}