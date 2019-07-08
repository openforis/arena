import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ItemsView from '../items/itemsView'
import CategoryEdit from '../categoryEdit/components/categoryEdit'

import Survey from '../../../../common/survey/survey'
import Category from '../../../../common/survey/category'
import Authorizer from '../../../../common/auth/authorizer'

import * as AppState from '../../../app/appState'
import * as SurveyState from '../../../survey/surveyState'
import * as CategoryEditState from '../categoryEdit/categoryEditState'

import {
  createCategory,
  deleteCategory,
  setCategoryForEdit,
} from '../categoryEdit/actions'

class CategoriesView extends React.Component {

  componentWillUnmount () {
    const { category, setCategoryForEdit } = this.props
    if (category)
      setCategoryForEdit(null)
  }

  render () {

    const {
      categories, category, selectedItemUuid,
      createCategory, deleteCategory, setCategoryForEdit,
      onSelect, onClose, canSelect,
      readOnly
    } = this.props

    const canDeleteCategory = category => category.usedByNodeDefs
      ? alert('This category is used by some node definitions and cannot be removed')
      : window.confirm(`Delete the category ${Category.getName(category)}? This operation cannot be undone.`)

    return (
      <ItemsView
        headerText="Categories"
        itemEditComponent={CategoryEdit}
        itemEditProp="category"
        itemLabelFunction={category => Category.getName(category)}
        editedItem={category}
        items={categories}
        selectedItemUuid={selectedItemUuid}
        onAdd={createCategory}
        onEdit={setCategoryForEdit}
        canDelete={canDeleteCategory}
        onDelete={deleteCategory}
        canSelect={canSelect}
        onSelect={onSelect}
        onClose={onClose}
        readOnly={readOnly}/>
    )
  }
}

const mapStateToProps = (state) => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)

  const categories = R.pipe(
    Survey.getCategoriesArray,
    R.map(category => ({
      ...category,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey))
    }))
  )(survey)

  return {
    categories,
    category: CategoryEditState.getCategoryForEdit(state),
    readOnly: !Authorizer.canEditSurvey(user, surveyInfo)
  }
}

export default connect(
  mapStateToProps,
  {
    createCategory,
    deleteCategory,
    setCategoryForEdit,
  }
)(CategoriesView)
