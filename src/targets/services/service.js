import fetch from 'node-fetch'
global.fetch = fetch

import CozyClient from 'cozy-client'
import { Document } from 'cozy-doctypes'
import flag from 'cozy-flags'

import { schema } from 'doctypes'
import { Settings } from 'models'

import logger from 'cozy-logger'

const log = logger.namespace('service')

export const runService = async service => {
  const client = CozyClient.fromEnv(process.env, {
    schema
  })
  Document.registerClient(client)

  const settings = await Settings.fetchWithDefault()
  const localModelOverrideValue = settings.community.localModelOverride.enabled
  log('info', 'Setting local model override flag to ' + localModelOverrideValue)
  flag('local-model-override', localModelOverrideValue)

  return service({ client }).catch(e => {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  })
}

export const lang = process.env.COZY_LOCALE || 'en'
export const dictRequire = lang => require(`../../locales/${lang}`)
