import { useDeleteTaxonomyIfEmpty } from './useDeleteTaxonomyIfEmpty'
import { useInit } from './useInit'
import { useToggleEditExtraPropertiesPanel } from './useToggleEditExtraPropertiesPanel'
import { useUpdate } from './useUpdate'
import { useUpdateTaxonomyExtraPropDef } from './useUpdateTaxonomyExtraPropDef'
import { useUpload } from './useUpload'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),
  upload: useUpload({ setState }),
  update: useUpdate({ setState }),
  deleteTaxonomyIfEmpty: useDeleteTaxonomyIfEmpty({ setState }),
  toggleEditExtraPropertiesPanel: useToggleEditExtraPropertiesPanel({ setState }),
  updateTaxonomyExtraPropDef: useUpdateTaxonomyExtraPropDef({ setState }),
})
