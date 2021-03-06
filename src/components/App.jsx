import React, { useEffect } from 'react'

import flag from 'cozy-flags'
import { queryConnect } from 'cozy-client'
import { withRouter } from 'react-router'
import { flowRight as compose } from 'lodash'

import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { Layout, Main, Content } from 'cozy-ui/transpiled/react/Layout'
import Sidebar from 'cozy-ui/transpiled/react/Sidebar'

import { settingsConn } from 'doctypes'

import Nav from 'ducks/commons/Nav'
import { Warnings } from 'ducks/warnings'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import { pinGuarded } from 'ducks/pin'

import ErrorBoundary from 'components/ErrorBoundary'
import ReactHint from 'components/ReactHint'
import RouterContext from 'components/RouterContext'
import AppSearchBar from 'components/AppSearchBar'

import styles from './App.styl'

const App = props => {
  const settings = getDefaultedSettingsFromCollection(props.settingsCollection)
  useEffect(() => {
    flag('local-model-override', settings.community.localModelOverride.enabled)
  }, [settings.community.localModelOverride.enabled])

  return (
    <RouterContext.Provider value={props.router}>
      <BreakpointsProvider>
        {flag('banks.search') ? <AppSearchBar /> : null}
        <Layout>
          <Sidebar>
            <Nav />
          </Sidebar>

          <Main>
            <Content className={styles.Main}>
              <ErrorBoundary>{props.children}</ErrorBoundary>
            </Content>
          </Main>

          {/* Outside every other component to bypass overflow:hidden */}
          <ReactHint />

          <Warnings />
          <Alerter />
        </Layout>
      </BreakpointsProvider>
    </RouterContext.Provider>
  )
}

export default compose(
  pinGuarded({
    timeout: flag('pin.debug') ? 10 * 1000 : undefined,
    showTimeout: flag('pin.debug')
  }),
  queryConnect({ settingsCollection: settingsConn }),
  withRouter
)(App)
