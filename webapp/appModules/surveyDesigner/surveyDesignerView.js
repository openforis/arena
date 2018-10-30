import './style.scss'

import React from 'react'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfoComponent from './components/surveyInfoComponent'
import SurveyFormView from '../../survey/form/components/surveyFormView'
import CodeListsView from '../../survey/codeLists/codeListsView'
import TaxonomiesView from '../../survey/taxonomies/taxonomiesView'

const SurveyDesignerView = () => (

  <TabBar
    className="survey-designer grid100"
    tabs={[
      {label: 'Survey Info', component: SurveyInfoComponent},
      {label: 'Form Designer', component: SurveyFormView, props: {edit: true, draft: true}},
      {label: 'Code Lists', component: CodeListsView},
      {label: 'Taxonomies', component: TaxonomiesView},
    ]}/>

)

export default SurveyDesignerView