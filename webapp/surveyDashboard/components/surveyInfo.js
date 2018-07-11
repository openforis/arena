import React from 'react'

class SurveyInfo extends React.Component {

  render () {
    return <div className="survey-info__container">

      <input className="text-center" placeholder="Survey name"/>

      <div className="survey-info__actions">
        <div className="survey-info__status">
          Status: DRAFT!
        </div>
        <button className="btn btn-of-light">
          <span className="icon icon-download3 icon-24px"></span>
        </button>

        <button className="btn btn-of-light">
          <span className="icon icon-upload3 icon-24px"></span>
        </button>
      </div>
    </div>
  }
}

export default SurveyInfo