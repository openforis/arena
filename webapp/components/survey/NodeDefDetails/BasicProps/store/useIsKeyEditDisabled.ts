import * as NodeDef from '@core/survey/nodeDef'

import { useIsMaxKeysCountReached } from './useIsMaxKeysCountReached'

export const useIsKeyEditDisabled = ({ nodeDef }: { nodeDef: any }): boolean => {
  const maxKeysCountReached = useIsMaxKeysCountReached({ nodeDef })

  if (!nodeDef || NodeDef.isRoot(nodeDef) || NodeDef.isMultiple(nodeDef)) {
    return true
  }
  return NodeDef.isAutoIncrementalKey(nodeDef) || (!NodeDef.isKey(nodeDef) && maxKeysCountReached)
}
