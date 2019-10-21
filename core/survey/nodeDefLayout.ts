import * as R from 'ramda';
import ObjectUtils from '../objectUtils';
import { SurveyCycleKey } from './_survey/surveyInfo';

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
export interface ILayout { [cycleKey: string]: any; }

const newLayout: (cycle: SurveyCycleKey, renderType: any, pageUuid?: string) => ILayout
= (cycle, renderType, pageUuid = null) => R.pipe(
  R.assocPath([cycle, keys.renderType], renderType),
  R.when(
    _ => !!pageUuid,
    R.assocPath([cycle, keys.pageUuid], pageUuid)
  )
)({})

// ====== READ

const getLayout: (x: any) => ILayout = ObjectUtils.getProp(keys.layout, {})

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

const rejectNodeDefsWithPage: (cycle: SurveyCycleKey) => (x: any[]) => any[] = cycle => R.reject(hasPage(cycle))

const filterNodeDefsWithPage: (cycle: SurveyCycleKey) => (x: any[]) => any[] = cycle => R.filter(hasPage(cycle))

export default {
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
};
