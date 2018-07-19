import {
  uuidv4
} from '../../../../common/uuid'

import {
  entityDefRenderType
} from '../../../../common/survey/nodeDef'


const id = -1

export const newNodeDef = (surveyId, parentId) => {

  const nodeDef = {
    id,
    hash: null,
    surveyId,
    parentId,
    //nodeDefType
    type: null,

    props: {
      name: '',
      multiple: false,//boolean
      required: false,//boolean
    },
  }

  return nodeDef
}

export const newEntityDef = (surveyId, parentId) => {
  const nodeDef = newNodeDef(surveyId, parentId)

  const entityDef = {
    ...nodeDef,

    props: {
      ...nodeDef.props,
      renderType: entityDefRenderType.inline,
    },
  }

  return entityDef
}

export const newGridDef = () => {
  const grid = {
    //first cell is itself
    cols: 1,
    rows: 1,
    nodeDefIds: [],

    //child grids
    children: [],
  }

  return grid
}

export const newPageDef = (entityId = -1) => {

  const pageDef = {
    entityId,
    uuid: uuidv4(),

    grid: newGridDef(),

    // child pages
    children: [],
  }

  return pageDef
}

