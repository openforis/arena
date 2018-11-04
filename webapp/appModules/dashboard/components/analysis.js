import React from 'react'
import { connect } from 'react-redux'

class Analysis extends React.Component {

  render () {
    return (
      <div className="app-dashboard__module">

        <div className="flex-center title-of">
          <span className="icon icon-calculator icon-24px icon-left"/>
          <h5>Data Analysis</h5>
        </div>

        {
          // surveyStatus.isNew(surveyStatusApp)
          //   ? (
          <div style={{opacity: .2}}>
            <span className="icon icon-32px icon-sigma"></span>
            <span className="icon icon-32px icon-subscript2"></span>
            <span className="icon icon-32px icon-subscript"></span>
            <span className="icon icon-32px icon-superscript"></span>
            <span className="icon icon-32px icon-superscript2"></span>
            <span className="icon icon-32px icon-omega"></span>
          </div>


          // )
          // : (
          //   null
          // )
        }

        <div style={{opacity: .2}}>
          <span className="icon icon-32px icon-quill"></span>
          <span className="icon icon-32px icon-insert-template"></span>
          <span className="icon icon-32px icon-pagebreak"></span>
          <span className="icon icon-32px icon-ungroup"></span>
          <span className="icon icon-32px icon-tree"></span>
          <span className="icon icon-32px icon-pencil2"></span>
        </div>

      </div>
    )
  }

}

Analysis.defaultProps = {
  dataAnalysis: {
    surveyId: -1,
    samplingDesign: null,
    entities: {count: 0},
    // attributes: {count: 0},
    outputAttributes: {count: 0}
  }
}

const mapStateToProps = state => ({
  surveyStatusApp: 'draft',
})

export default connect(mapStateToProps)(Analysis)