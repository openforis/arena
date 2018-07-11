import React, { Fragment } from 'react'
import { Link, Route } from 'react-router-dom'

class SurveyModules extends React.Component {

  render () {
    return <Fragment>

      <div className="survey-modules__module-container">
        <div className="survey-modules__module">
          <div className="flex-center title-of">
            <span className="icon icon-quill icon-24px icon-left"/>
            <h5>Survey Designer</h5>
          </div>
        </div>
      </div>

      <div className="survey-dashboard__module-container">
        <div className="survey-modules__module">2</div>
      </div>

      <div className="survey-dashboard__module-container">
        <div className="survey-modules__module">3</div>
      </div>

      <div className="survey-dashboard__module-container">
        <div className="survey-modules__module">4<Route path={'/app/a'} render={() => <div>aaaa</div>}/></div>
      </div>

    </Fragment>
  }
}

export default SurveyModules