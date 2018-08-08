const {
  nodeDefType,
} = require('../common/survey/nodeDef')

const id = '-1'

const nodeDef = {
  id,
  uuid: null,
  parentId: id,
  type: null, //nodeDefType
  dateCreated: null,
  dateModified: null,

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
    key: false,//boolean
    multiple: false,//boolean
    applicable: true,//expr

    // entity:
    ///layout
    pageUUID: null, // uuid - if this entity renders in its own page
    render: 'form', //|| table
    layout: [],// rect-grid-layout layout value

    // not entity:
    calculated: false, //boolean expression
    defaultValues: [], //expression

    //nodeDefCodeList
    codeListUUID: id,
    //or
    parentCodeUUID: id,

    //all
    validations: [], //nodeDefValidation
  },

  propsDraft: {}
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