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
  hash: null,
  parentId: id,
  surveyId: id,
  //nodeDefType
  type: null,

  props: {
    name: '',
    multiple: false,//boolean
    required: false,//boolean
  },
}

const attributeDef = {
  ...nodeDef,
  type: nodeDefType.attribute,

  props: {
    ...nodeDef.props,
    type: null,
    default: null,
  },
}

const entityDef = {
  ...nodeDef,
  type: nodeDefType.entity,
  keyAttributeDefId: id,

  props: {
    ...nodeDef.props,
    renderType: entityDefRenderType.inline,
  },

  // load first level
  children: {
    //key value objs can be entityDef or attributDef
    [id]: attributeDef
  },

  //validation status only rootEntity?
  //validation: {},


}

const survey = {
  id,
  hash: null,
  ownerId: id,

  // root entity
  entityDefId: id,

  // status columns
  draft: false,
  published: false,

  props: {
    name: 'name',
    label: '',
  },

  // only survey contains the pageDef
  pageDef,

  //no store
  entityDef,
}

console.log(JSON.stringify(survey))