import './utils/polyfill/polyfill'
import './style/main.scss'

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { AppContainer } from 'react-hot-loader'

import { store } from '@webapp/store'
import Arena from '@webapp/views/Arena'

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Arena />
    </BrowserRouter>
  </Provider>
)
//
// function renderApp() {
//   ReactDOM.render(
//     <AppContainer>
//       <App />
//     </AppContainer>,
//     document.querySelector('#main')
//   )
// }
//
// renderApp()
//
// if (module.hot) {
//   module.hot.accept()
// }
//
// if (module.hot) {
//   module.hot.accept('./App', () => {
//     ReactDOM.render(
//       <AppContainer>
//         <App />
//       </AppContainer>,
//       document.getElementById('root')
//     )
//   })
// }

//

const render = (Component) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('main')
  )
}

render(App)

// webpack Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./views/Arena', () => {
    render(require('./views/Arena'))
  })
}
