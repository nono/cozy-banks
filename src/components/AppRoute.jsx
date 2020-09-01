import React from 'react'
import { IndexRoute, Route, Redirect } from 'react-router'
import App from 'components/App'
import { isWebApp } from 'cozy-device-helper'
import flag from 'cozy-flags'

import { TransactionsPageWithBackButton } from 'ducks/transactions'
import { CategoriesPage } from 'ducks/categories'
import {
  Settings,
  AccountsSettings,
  AccountSettings,
  GroupsSettings,
  GroupSettings,
  NewGroupSettings,
  Configuration,
  Debug
} from 'ducks/settings'
import OldAccountSettings from 'ducks/settings/OldAccountSettings'
import { Balance, BalanceDetailsPage } from 'ducks/balance'
import {
  DebugRecurrencePage,
  RecurrencesPage,
  RecurrencePage
} from 'ducks/recurrence'
import { TransferPage } from 'ducks/transfers'
import { SearchPage } from 'ducks/search'
import UserActionRequired from 'components/UserActionRequired'
import scrollToTopOnMount from 'components/scrollToTopOnMount'

// Use a function to delay instantation and have access to AppRoute.renderExtraRoutes
const AppRoute = () => (
  <Route component={UserActionRequired}>
    <Route component={App}>
      {isWebApp() && <Redirect from="/" to="balances" />}
      <Route path="balances">
        <IndexRoute component={scrollToTopOnMount(Balance)} />
        <Route
          path="details"
          component={scrollToTopOnMount(BalanceDetailsPage)}
        />
      </Route>
      <Route path="categories">
        <IndexRoute component={scrollToTopOnMount(CategoriesPage)} />
        <Route
          path=":categoryName/:subcategoryName"
          component={scrollToTopOnMount(TransactionsPageWithBackButton)}
        />
        <Route
          path=":categoryName"
          component={scrollToTopOnMount(CategoriesPage)}
        />
      </Route>
      <Route path="recurrence">
        <IndexRoute component={scrollToTopOnMount(RecurrencesPage)} />
        <Route
          path=":bundleId"
          component={scrollToTopOnMount(RecurrencePage)}
        />
      </Route>
      <Route path="settings">
        <Route
          path="groups/new"
          component={scrollToTopOnMount(NewGroupSettings)}
        />
        <Route
          path="groups/:groupId"
          component={scrollToTopOnMount(GroupSettings)}
        />

        {/* This route will be removed after finishing transition to Harvest for account settings */}
        <Route
          path={
            flag('banks.harvest-accounts-settings')
              ? 'old-accounts/:accountId'
              : 'accounts/:accountId'
          }
          component={scrollToTopOnMount(AccountSettings)}
        />
        <Redirect from="accounts/:accountId" to="accounts" />
        <Route component={scrollToTopOnMount(Settings)}>
          <IndexRoute component={Configuration} />
          <Route
            path="accounts"
            component={
              flag('banks.harvest-accounts-settings')
                ? AccountsSettings
                : OldAccountSettings
            }
          />
          <Route path="groups" component={GroupsSettings} />
          <Route path="configuration" component={Configuration} />
          <Route path="debug" component={Debug} />
        </Route>
      </Route>
      <Route path="transfers" component={scrollToTopOnMount(TransferPage)} />
      <Route path="search" component={scrollToTopOnMount(SearchPage)} />
      <Route path="search/:search" component={scrollToTopOnMount(SearchPage)} />
      <Route path="transfers/:slideName" component={TransferPage} />
      <Route
        path="recurrencedebug"
        component={scrollToTopOnMount(DebugRecurrencePage)}
      />
      {AppRoute.renderExtraRoutes()}
      {isWebApp() && <Redirect from="*" to="balances" />}
    </Route>
  </Route>
)

// Ability to overrides easily
AppRoute.renderExtraRoutes = () => null

export default AppRoute
