import React from 'react'

import * as R from 'ramda'

import { uuidv4 } from '../../../../common/uuid'

import FormRendererComponent from '../../../survey/formRenderer/formRendererComponent'

const FormDesignerActions = () => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '.2fr .8fr',
    }}>
      <div style={{
        gridRow: '2',
        display: 'grid',
        gridRowGap: '1.5rem',
        alignContent: 'start'
      }}>
        <button className="btn btn-of-light">Add Attribute</button>
        <button className="btn btn-of-light">Add Entity</button>
        <button className="btn btn-of-light">Add Entity New Page</button>
      </div>
    </div>
  )
}

const newPageItemLayout = R.pipe(
  R.defaultTo({}),
  R.merge({
    i: '0',
    h: 1,
    w: 1,
    x: 0,
    y: 0,
    isDraggable: undefined,
    isResizable: undefined,
    maxH: undefined,
    maxW: undefined,
    minH: undefined,
    minW: undefined,
    moved: false,
    static: false,
  }),
)

const newPageDef = (entityDef) => ({
  entityDefId: entityDef.id,
  entityDefUUID: entityDef.uiid,
  columns: 3,
  uuid: uuidv4(),
})

const newPageLayout = (entityDef) => ({
  pageDef: newPageDef(entityDef),
})

class FormDesignerComponent extends React.Component {

  constructor (props) {
    super(props)
    //TODO: fetch survey layout prefs
    const {survey, entityDef} = props
    this.state = {survey, entityDef}
  }

  createLayout () {
    const {entityDef} = this.state

    const children = [
      {id: '0', props: {name: 'attrA'}, layout: newPageItemLayout({})},
      {id: '1', props: {name: 'attrB'}, layout: newPageItemLayout({x: 1})},
      {id: '2', props: {name: 'attrC'}, layout: newPageItemLayout({x: 2})},
      // item with no layout is added at the end of the grid
      {id: '3', props: {name: 'attrD'},},
      {id: '2', props: {type: 'entity', name: 'plot'}, layout: newPageLayout({id: '2', uuid: uuidv4()})},
      {id: '3', props: {type: 'entity', name: 'sub_root_entity'}, layout: newPageItemLayout({render: 'table'})},
    ]

    const layout = newPageLayout(entityDef)

    this.setState({
      entityDef: R.pipe(
        R.assoc('layout', layout),
        R.assoc('children', children),
      )(entityDef)
    })
  }

  render () {

    const {entityDef} = this.state
    const {layout} = entityDef

    return (
      R.isNil(layout)
        ? (
          <div style={{display: 'grid', justifyContent: 'center', alignContent: 'start'}}>
            <button className="btn btn-of-light"
                    onClick={() => this.createLayout()}>
              Start
            </button>
          </div>
        )
        : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '.8fr .2fr',
          }}>
            <FormRendererComponent entityDef={entityDef}/>
            <FormDesignerActions/>
          </div>
        )

    )
  }

}

FormDesignerComponent.defaultProps = {
  survey: {
    rootEntityDefId: '1',
  },
  //rootEntityDef
  entityDef: {
    surveyId: '1',
    parentId: null,
    props: {
      'id': '1',
      'name': 'root_entity',
      'type': 'e',
      'uuid': '0bce2450-a68f-494d-9e83-f4f7471b83bb',
      'label': 'Root entity',
    },
    layout: null,
  }
  ,
}

export default FormDesignerComponent