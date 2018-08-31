import React from 'react'
import { connect } from 'react-redux'

import DataFetchComponent from '../components/moduleDataFetchComponent'

import { appModules, getDashboardData } from '../appModules'

import Dropdown from '../../commonComponents/form/dropdown'

class SurveyInfoView extends React.Component {

  render () {
    const {survey} = this.props

    return (
      <DataFetchComponent module={appModules.survey} dashboard={true}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '.2fr .4fr .4fr',
          alignContent: 'center',
          backgroundColor: 'rgba(198, 214, 225, 0.1)',
        }}>

          <Dropdown className="dropdown-of"
                    placeholder="Survey name"
                    value={survey.name}
                    items={['survey 1', 'survey 2', 'survey 3', 'survey 4']}
                    style={{gridColumn: 2}}
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, auto)',
            gridColumnGap: '2rem',
            padding: '0 1rem',
            justifyContent: 'center',
            alignItems: 'center',
          }}>

            <button className="btn btn-of-light">
              <span className="icon icon-warning icon-20px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-download3 icon-20px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-upload3 icon-20px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-bin icon-20px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-plus icon-20px"/>
            </button>

          </div>
        </div>
      </DataFetchComponent>
    )
  }
}

SurveyInfoView.defaultProps = {
  survey: {
    id: -1,
    name: ''
  }
}

const mapStateToProps = state => ({
  survey: getDashboardData(appModules.survey)(state)
})

export default connect(mapStateToProps)(SurveyInfoView)