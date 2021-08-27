import { useInit } from './useInit'
import { useUpload } from './useUpload'
import { useUpdate } from './useUpdate'
import { useDeleteTaxonomyIfEmpty } from './useDeleteTaxonomyIfEmpty'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),
  upload: useUpload({ setState }),
  update: useUpdate({ setState }),
  deleteTaxonomyIfEmpty: useDeleteTaxonomyIfEmpty({ setState }),
})
