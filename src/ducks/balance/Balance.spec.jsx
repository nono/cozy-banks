import { shallow, mount } from 'enzyme'
import getClient from 'test/client'
const React = require('react')
const { DumbBalance } = require('./Balance')
const debounce = require('lodash/debounce')
import fixtures from 'test/fixtures'
import Loading from 'components/Loading'

jest.mock('lodash/debounce', () => jest.fn(fn => fn))

jest.mock('ducks/balance/BalanceHeader', () => () => null)
jest.mock('ducks/balance/NoAccount', () => () => null)
jest.mock('components/Loading', () => () => null)

jest.useFakeTimers()

const fakeCollection = (doctype, data, fetchStatus) => ({
  data: data || [],
  fetchStatus: fetchStatus || 'loaded'
})

const router = {
  push: jest.fn()
}

describe('Balance page', () => {
  const setup = ({ accountsData } = {}) => {
    const filterByAccounts = jest.fn()
    const settingDoc = {}
    const client = getClient()
    client.save = jest.fn()
    const root = shallow(
      <DumbBalance
        accounts={fakeCollection('io.cozy.bank.accounts', accountsData || [])}
        virtualAccounts={[]}
        groups={fakeCollection('io.cozy.bank.groups')}
        virtualGroups={[]}
        settings={fakeCollection('io.cozy.bank.settings', [settingDoc])}
        triggers={fakeCollection('io.cozy.triggers')}
        transactions={fakeCollection('io.cozy.bank.operations')}
        filterByAccounts={filterByAccounts}
        router={router}
        client={client}
      />
    )
    const instance = root.instance()

    return { root, client, instance, router, filterByAccounts }
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should call filterByAccounts prop with getCheckAccounts', () => {
    const { root, instance, router, filterByAccounts } = setup()
    let accounts = []
    instance.getCheckedAccounts = () => {
      return accounts
    }
    root.instance().handleClickBalance()
    expect(router.push).toHaveBeenCalledWith('/balances/details')
    expect(filterByAccounts).toHaveBeenCalledWith(accounts)
  })

  describe('data fetching', () => {
    it('should start periodic data fetch if no accounts', () => {
      const { instance } = setup()

      jest.spyOn(instance, 'startRealtimeFallback')
      jest.spyOn(instance, 'stopRealtimeFallback')
      instance.ensureListenersProperlyConfigured()
      expect(instance.startRealtimeFallback).toHaveBeenCalled()
      expect(instance.startRealtimeFallback).toHaveBeenCalled()
    })
    it('should stop periodic data fetch if there are accounts', () => {
      const accounts = fixtures['io.cozy.bank.accounts']
      const { instance } = setup({ accountsData: accounts })

      jest.spyOn(instance, 'startRealtimeFallback')
      jest.spyOn(instance, 'stopRealtimeFallback')
      instance.ensureListenersProperlyConfigured()
      expect(instance.startRealtimeFallback).not.toHaveBeenCalled()
      expect(instance.stopRealtimeFallback).toHaveBeenCalled()
    })

    it('should correctly start realtime fallback', () => {
      const { instance } = setup()
      jest
        .spyOn(global, 'setInterval')
        .mockReset()
        .mockImplementation(() => 1337)
      instance.startRealtimeFallback()
      expect(global.setInterval).toHaveBeenCalledWith(
        instance.updateQueries,
        30000
      )
      expect(global.setInterval).toHaveBeenCalledTimes(1)
      instance.startRealtimeFallback()
      expect(global.setInterval).toHaveBeenCalledTimes(1)
    })

    it('should correctly stop realtime fallback', () => {
      const { instance } = setup()
      jest
        .spyOn(global, 'setInterval')
        .mockReset()
        .mockImplementation(() => 1337)
      jest
        .spyOn(global, 'clearInterval')
        .mockReset()
        .mockImplementation(() => {})
      instance.startRealtimeFallback()
      instance.stopRealtimeFallback()
      expect(global.clearInterval).toHaveBeenCalledWith(1337)
      expect(instance.realtimeFallbackInterval).toBe(null)
      instance.stopRealtimeFallback()
      expect(global.clearInterval).toHaveBeenCalledTimes(1)
    })
  })

  describe('panel toggling', () => {
    it('should debounce handlePanelChange', () => {
      const { instance } = setup({ accountsData: [{ balance: 12345 }] })
      expect(debounce).toHaveBeenCalledWith(instance.handlePanelChange, 3000, {
        leading: false,
        trailing: true
      })
    })

    it('should call savePanelState when handling panel change', () => {
      const { instance } = setup()
      instance.setState = (fn, callback) => callback.apply(instance)
      jest.spyOn(instance, 'savePanelState')
      instance.handlePanelChange()
      instance.handlePanelChange()
      instance.handlePanelChange()
      expect(instance.savePanelState).toHaveBeenCalledTimes(3)
    })

    it('should call save when saving panel state', () => {
      const { instance, client } = setup()
      instance.savePanelState()
      expect(client.save).toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    const commonProps = {
      virtualAccounts: [],
      virtualGroups: [],
      triggers: fakeCollection('io.cozy.triggers'),
      filterByAccounts: jest.fn(),
      router: router,
      client: getClient()
    }

    const isLoading = root => root.find(Loading).length > 0

    it('should be in loading state if accounts is loading', () => {
      expect(
        isLoading(
          mount(
            <DumbBalance
              accounts={fakeCollection('io.cozy.bank.accounts', [], 'loading')}
              groups={fakeCollection('io.cozy.bank.groups')}
              settings={fakeCollection('io.cozy.bank.settings', [])}
              transactions={fakeCollection('io.cozy.bank.operations')}
              {...commonProps}
            />
          )
        )
      ).toBe(true)
    })

    it('should be in loading state if groups is loading', () => {
      expect(
        isLoading(
          mount(
            <DumbBalance
              accounts={fakeCollection('io.cozy.bank.accounts', [])}
              groups={fakeCollection('io.cozy.bank.groups', [], 'loading')}
              settings={fakeCollection('io.cozy.bank.settings', [])}
              transactions={fakeCollection('io.cozy.bank.operations')}
              {...commonProps}
            />
          )
        )
      ).toBe(true)
    })

    it('should be in loading state if settings is loading', () => {
      expect(
        isLoading(
          mount(
            <DumbBalance
              accounts={fakeCollection('io.cozy.bank.accounts', [])}
              groups={fakeCollection('io.cozy.bank.groups', [])}
              settings={fakeCollection('io.cozy.bank.settings', [], 'loading')}
              transactions={fakeCollection('io.cozy.bank.operations', [])}
              {...commonProps}
            />
          )
        )
      ).toBe(true)
    })

    it('should not be in loading state if triggers are loading (since they are not stored offline)', () => {
      expect(
        isLoading(
          mount(
            <DumbBalance
              accounts={fakeCollection('io.cozy.bank.accounts', [])}
              groups={fakeCollection('io.cozy.bank.groups', [])}
              settings={fakeCollection('io.cozy.bank.settings', [])}
              transactions={fakeCollection('io.cozy.bank.operations', [])}
              {...commonProps}
              triggers={fakeCollection('io.cozy.bank.triggers', [], 'loading')}
            />
          )
        )
      ).toBe(false)
    })
  })
})
