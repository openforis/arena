import * as NodeDef from '@core/survey/nodeDef'

import { createNodeDef } from './createNodeDef'

export const createVirtualEntity = ({ history }) =>
  createNodeDef({ history, type: NodeDef.nodeDefType.entity, virtual: true, analysis: false })
