import React from 'react'
import { Route } from 'react-router-dom'

class SurveyModules extends React.Component {

  render () {
    return <div className="survey-modules">

      {/*<div className="survey-modules__module-container">*/}
      <div className="survey-modules__module">
        <div className="flex-center title-of">
          <span className="icon icon-quill icon-24px icon-left"/>
          <h5>Survey Designer</h5>
        </div>
      </div>
      {/*</div>*/}

      {/*<div className="survey-dashboard__module-container">*/}
      <div className="survey-modules__module">
        <div className="flex-center title-of">
          <span className="icon icon-table2 icon-24px icon-left"/>
          <h5>Data Explorer</h5>
        </div>
      </div>
      {/*</div>*/}

      {/*<div className="survey-dashboard__module-container">*/}
      <div className="survey-modules__module">
        <div className="flex-center title-of">
          <span className="icon icon-calculator icon-24px icon-left"/>
          <h5>Data Analysis</h5>
        </div>
      </div>
      {/*</div>*/}

      {/*<div className="survey-dashboard__module-container">*/}
      <div className="survey-modules__module">
        <div className="flex-center title-of">
          <span className="icon icon-users icon-24px icon-left"/>
          <h5>Users</h5>
        </div>
        <Route path={'/app/a'} render={() => <div>aaaa</div>}/>
      </div>
      {/*</div>*/}

    </div>
  }
}

export default SurveyModules