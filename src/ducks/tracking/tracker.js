/* global __PIWIK_TRACKER_URL__, __PIWIK_SITEID__ */

import memoize from 'lodash/memoize'

import flag from 'cozy-flags'
import { getTracker as uiGetTracker } from 'cozy-ui/transpiled/react/helpers/tracker'
/* global __PIWIK_TRACKER_URL__, __PIWIK_SITEID__ */

import Alerter from 'cozy-ui/transpiled/react/Alerter'

export const trackerShim = {
  trackPage: () => {},
  trackEvent: () => {}
}

export const getMatomoTracker = memoize(() => {
  const trackerInstance = uiGetTracker(
    __PIWIK_TRACKER_URL__,
    __PIWIK_SITEID__,
    true, //
    false
  )

  if (!trackerInstance) {
    return trackerShim
  }

  trackerInstance.push([
    'setTrackerUrl',
    'https://matomo.cozycloud.cc/matomo.php'
  ])
  trackerInstance.push(['setSiteId', 8])

  return {
    trackEvent: event => {
      const { name, action, category } = event
      if (!name) {
        throw new Error('An event must have at least a name')
      }
      if (flag('banks.show-tracking-alerts')) {
        Alerter.info(`Tracking event: ${JSON.stringify(event)}`)
      }
      trackerInstance.push(['trackEvent', category, name, action])
    },
    trackPage: pagePath => {
      const message = `Tracking page ${pagePath}`
      if (flag('banks.show-tracking-alerts')) {
        Alerter.info(message)
      }
      trackerInstance.push([
        'setCustomUrl',
        'https://cozy-banks/' + pagePath.replace(/:/g, '/')
      ])
      trackerInstance.push(['trackPageView'])
    }
  }
})

export const getTracker = getMatomoTracker
