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
    pageUuid: null, // uuid - if this entity renders in its own page
    render: 'form', //|| table
    layout: [],// rect-grid-layout layout value (form layout) or sorted children uuids (table layout)

    // not entity:
    defaultValues: [], //expression

    //nodeDefCode
    categoryUuid: id,
    //or
    parentCodeDefUuid: id,

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
  ownerId: id,
  step: id, // current step id
  dateCreated: null,
}

const node = {
  id,
  uuid: null,
  surveyId: id,
  recordUuid: id,
  parentId: id, // can be null
  nodeDefId: id,
  // value is a key value pairs object where
  // key is the step id
  // value is the node value at the given step
  value: {
    '1': 'ytreyrte', //node string
    '2': '545235', // node integer
    '3': '545235.5634', // node decimal
    '3': 'true', // node boolean
    '1': '12/12/2005', // node date DD/MM/YYYY
    '1': '11:55', // node time mm:HH
    '1': {'x': '5432543', 'y': '42565342', 'srs': '4326'}, // node coordinate
  },
}

const recordCommand = {
  action: null, //recordActions
  userId: id,
  surveyId: id,
  recordUuid: id,
  parentId: id, //only for addNode action
  nodeDefId: id,
  nodeId: id, //only for updateNode, deleteNode actions
  value: null,
}

const recordUpdateLog = {
  id: id,
  action: null, //recordActions
  userId: id,
  dateCreated: null,
  node: null,
}