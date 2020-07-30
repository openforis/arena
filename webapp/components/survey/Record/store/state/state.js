import * as A from '@core/arena'

const keys = {
  editable: 'editable',
  preview: 'preview',
  loaded: 'loaded',
}

// ===== CREATE

export const create = ({ preview }) => ({
  [keys.preview]: preview,
})

// ===== READ

export const isEditable = A.prop(keys.editable)
export const isPreview = A.prop(keys.preview)
export const isLoaded = A.prop(keys.loaded)

// ===== UPDATE

export const assocLoaded = (loaded) => A.assoc(keys.loaded, loaded)
export const assocEditable = (editable) => A.assoc(keys.editable, editable)
