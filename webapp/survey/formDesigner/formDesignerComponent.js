import React from 'react'

import * as R from 'ramda'

import FormComponent from '../form/formComponent'

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

const FormDesignerComponent = ({entityDef}) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '.8fr .2fr',
  }}>
    <FormComponent entityDef={entityDef}/>
    <FormDesignerActions/>
  </div>
)

export default FormDesignerComponent