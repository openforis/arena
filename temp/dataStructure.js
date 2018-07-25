const {
  nodeDefType,
  entityDefRenderType
} = require('../common/survey/nodeDef')

const id = -1

const pageDef = {
  entityId: id,

  grid: {
    //first cell is itself
    cols: 1,
    rows: 1,
    nodeDefIds: [],

    //child grids
    children: [],
  },

  // child pages
  children: [],
}

const nodeDef = {
  id,
  uuid: null,
  parentId: id,
  surveyVersionId: id,
  //nodeDefType
  type: null,

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
  },
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
    renderType: entityDefRenderType.table,
  },

  // load first level
  children: {
    //key value objs can be entityDef or attributDef
    [id]: attributeDef
  },

}

const surveyVersion = {
  id,
  surveyId: id,

  // root entity
  entityDefId: id,

  // status columns
  status: null,

  // only survey contains the pageDef
  pageDef,

  //no store
  entityDef,
}

const survey = {
  id,
  uuid: null,
  ownerId: id,

  //surveyVersion IDs
  publishedVersionId: id,
  draftSurveyVersionId: id,

  props: {
    name: 'name',
    labels: {
      en: '',
      es: '',
    },
  },

  surveyVersion,
}

console.log(JSON.stringify(survey))