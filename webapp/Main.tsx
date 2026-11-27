import '@fontsource/noto-sans'
import './utils/polyfill/polyfill'
import './style/main.scss'
// the store must be loaded before the app components: import cycles between them resolve only in this order
import '@webapp/store'

import { createRoot } from 'react-dom/client'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router'

import Arena from '@webapp/app/Arena'
import { store } from '@webapp/store/store'
import { i18nReady } from '@webapp/store/system/i18n'
import i18nInstance from '@webapp/store/system/i18n/i18nInstance'
import { SurveyThemeBridge } from '@webapp/theme/SurveyThemeBridge'
import { applyThemeMode, getThemePreference, resolveThemeMode } from '@webapp/theme/themeMode'

// apply the theme before the first render to avoid a flash of the light theme
applyThemeMode(resolveThemeMode(getThemePreference()))

// the preloader stays until the UI language is loaded
i18nReady.then(() => {
  document.getElementById('preloader-wrapper').remove()

  const container = document.getElementById('main')
  const root = createRoot(container)
  root.render(
    <Provider store={store}>
      <SurveyThemeBridge>
        <I18nextProvider i18n={i18nInstance}>
          <BrowserRouter>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Arena />
            </LocalizationProvider>
          </BrowserRouter>
        </I18nextProvider>
      </SurveyThemeBridge>
    </Provider>
  )
})
