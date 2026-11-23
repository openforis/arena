import { useInit } from './useInit'
import { useUpload } from './useUpload'
import { useUpdate } from './useUpdate'
import { useDeleteTaxonomyIfEmpty } from './useDeleteTaxonomyIfEmpty'
import { useToggleEditExtraPropertiesPanel } from './useToggleEditExtraPropertiesPanel'
import { useUpdateTaxonomyExtraPropDef } from './useUpdateTaxonomyExtraPropDef'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),
  upload: useUpload({ setState }),
  update: useUpdate({ setState }),
  deleteTaxonomyIfEmpty: useDeleteTaxonomyIfEmpty({ setState }),
  toggleEditExtraPropertiesPanel: useToggleEditExtraPropertiesPanel({ setState }),
  updateTaxonomyExtraPropDef: useUpdateTaxonomyExtraPropDef({ setState }),
})
