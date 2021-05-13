import * as NodeDefManager from '../manager/nodeDefManager'

export const { insertNodeDef, updateNodeDefProps, markNodeDefDeleted } = NodeDefManager

export {
  // ======  READ - entities
  countVirtualEntities,
  fetchVirtualEntities,
} from '../repository/nodeDefRepository'
