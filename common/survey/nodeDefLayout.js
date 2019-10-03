const R = require('ramda')

const ObjectUtils = require('../../common/objectUtils')

const keys = {
  layout: 'layout',
  // layout keys
  pageUuid: 'pageUuid', // page uuid
  renderType: 'renderType', // renderType
  columnsNo: 'columnsNo', // number of columns
  layoutChildren: 'layoutChildren', // React Data Grid layout (form layout) or sorted children uuids (table layout)
}

const renderType = {
  // entity
  form: 'form',
  table: 'table',
  // code
  dropdown: 'dropdown',
  checkbox: 'checkbox',

  // only components render
  tableHeader: 'tableHeader',
  tableBody: 'tableBody',
}

const displayIn = {
  parentPage: 'parentPage',
  ownPage: 'ownPage',
}

// ====== CREATE

const newLayout = (cycle, renderType, pageUuid = null) => {
  const layout = {
    [cycle]: {
      [keys.renderType]: renderType
    }
  }
  return R.when(
    R.always(pageUuid),
    R.assocPath([cycle, keys.pageUuid], pageUuid)
  )(layout)
}

// ====== READ

const getLayout = ObjectUtils.getProp(keys.layout, {})

const _getPropLayout = (cycle, prop, defaultTo = null) => R.pipe(
  getLayout,
  R.pathOr(defaultTo, [cycle, prop])
)

const getRenderType = cycle => _getPropLayout(cycle, keys.renderType)

const getLayoutChildren = cycle => _getPropLayout(cycle, keys.layoutChildren, [])

const getColumnsNo = cycle => _getPropLayout(cycle, keys.columnsNo, 3)

const getPageUuid = cycle => _getPropLayout(cycle, keys.pageUuid)

const getDisplayIn = cycle => R.ifElse(
  hasPage(cycle),
  R.always(displayIn.ownPage),
  R.always(displayIn.parentPage)
)

// ====== CHECK

const hasPage = cycle => R.pipe(getPageUuid(cycle), R.isNil, R.not)

const isRenderType = (cycle, type) => R.pipe(
  getRenderType(cycle),
  R.equals(type),
)
const isRenderTable = cycle => isRenderType(cycle, renderType.table)
const isRenderForm = cycle => isRenderType(cycle, renderType.form)
const isRenderDropdown = cycle => isRenderType(cycle, renderType.dropdown)
const isRenderCheckbox = cycle => isRenderType(cycle, renderType.checkbox)

const isDisplayInParentPage = cycle => R.pipe(
  getDisplayIn(cycle),
  R.propEq(displayIn.parentPage)
)
// ====== UTILS

const rejectNodeDefsWithPage = cycle => R.reject(hasPage(cycle))

const filterNodeDefsWithPage = cycle => R.filter(hasPage(cycle))

module.exports = {
  keys,
  renderType,
  displayIn,

  //CREATE
  newLayout,

  //READ
  getLayout,
  getRenderType,
  getLayoutChildren,
  getColumnsNo,
  getPageUuid,
  getDisplayIn,

  //CHECK
  hasPage,
  isRenderTable,
  isRenderForm,
  isRenderDropdown,
  isRenderCheckbox,
  isDisplayInParentPage,

  //UTILS
  rejectNodeDefsWithPage,
  filterNodeDefsWithPage,
}