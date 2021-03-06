import {
  getAccountUpdateDateDistance,
  distanceInWords,
  getAccountType,
  getAccountBalance,
  buildHealthReimbursementsVirtualAccount,
  buildVirtualAccounts,
  addOwnerToAccount,
  buildProfessionalReimbursementsVirtualAccount,
  buildOthersReimbursementsVirtualAccount
} from './helpers'
import { getCategoryIdFromName } from 'ducks/categories/helpers'
import { CONTACT_DOCTYPE } from 'doctypes'
import MockDate from 'mockdate'
import fixtures from 'test/fixtures/unit-tests'
import flag from 'cozy-flags'

jest.mock('cozy-flags')

describe('getAccountUpdateDateDistance', () => {
  it('should return null if an argument is missing', () => {
    const account = { cozyMetadata: { updatedAt: new Date(2019, 0, 10) } }
    const from = new Date(2019, 0, 10)

    expect(getAccountUpdateDateDistance()).toBeNull()
    expect(getAccountUpdateDateDistance(account)).toBeNull()
    expect(getAccountUpdateDateDistance(undefined, from)).toBeNull()
  })

  it('should return the right distance in days', () => {
    const account = { cozyMetadata: { updatedAt: new Date(2019, 0, 1) } }

    expect(getAccountUpdateDateDistance(account, new Date(2019, 0, 10))).toBe(9)
    expect(getAccountUpdateDateDistance(account, new Date(2019, 0, 2))).toBe(1)
  })
})

describe('distanceInWords', () => {
  it('should return the right string for a given distance', () => {
    expect(distanceInWords(0)).toBe('Balance.updated_at.today')
    expect(distanceInWords(1)).toBe('Balance.updated_at.yesterday')
    expect(distanceInWords(2)).toBe('Balance.updated_at.n_days_ago')
    expect(distanceInWords(10)).toBe('Balance.updated_at.n_days_ago')
    expect(distanceInWords()).toBe('Balance.updated_at.unknown')
  })
})

describe('getAccountType', () => {
  it('should map types correctly', () => {
    const accountTypes = {
      Other: ['Unkown', 'None'],
      LongTermSavings: [
        'Article83',
        'LifeInsurance',
        'Madelin',
        'Market',
        'Mortgage',
        'PEA',
        'PEE',
        'Perco',
        'Perp',
        'RSP'
      ],
      Business: ['Asset', 'Capitalisation', 'Liability'],
      Checkings: ['Bank', 'Cash', 'Deposit'],
      Loan: ['ConsumerCredit', 'RevolvingCredit'],
      CreditCard: ['Credit card']
    }

    for (const [mapped, originals] of Object.entries(accountTypes)) {
      for (const original of originals) {
        expect(getAccountType({ type: original })).toBe(mapped)
      }
    }
  })
})

describe('getAccountBalance', () => {
  it('should return the comingBalance if the account is a CreditCard one and it has a comingBalance', () => {
    const account = {
      type: 'CreditCard',
      comingBalance: 100,
      balance: 200
    }

    expect(getAccountBalance(account)).toBe(account.comingBalance)
  })

  it('should return the balance if the account is a CreditCard one but it has no comingBalance', () => {
    const account = {
      type: 'CreditCard',
      balance: 200
    }

    expect(getAccountBalance(account)).toBe(account.balance)
  })

  it('should return the balance if the account is not a CreditCard one', () => {
    const account = { type: 'Checkings', balance: 200 }

    expect(getAccountBalance(account)).toBe(account.balance)
  })
})

describe('buildHealthReimbursementsVirtualAccount', () => {
  const healthExpensesCategory = getCategoryIdFromName('healthExpenses')
  let transactions

  beforeEach(() => {
    transactions = [
      {
        manualCategoryId: healthExpensesCategory,
        amount: -10,
        date: '2019-01-02'
      },
      {
        manualCategoryId: healthExpensesCategory,
        amount: -10,
        date: '2019-01-02'
      },
      {
        manualCategoryId: healthExpensesCategory,
        amount: -10,
        date: '2019-01-02'
      },
      {
        manualCategoryId: healthExpensesCategory,
        amount: -10,
        date: '2019-01-02'
      },
      {
        manualCategoryId: healthExpensesCategory,
        amount: -10,
        date: '2018-01-02'
      },
      { manualCategoryId: '400470', amount: 10 }
    ]
    MockDate.set(new Date('2019-04-08T00:00:00.000Z'))
  })

  afterEach(() => {
    MockDate.reset()
  })

  it('should return a balance equals to 0 if no transactions', () => {
    const virtualAccount = buildHealthReimbursementsVirtualAccount([])
    expect(virtualAccount.balance).toBe(0)
  })

  it('should sum only this year transactions amounts', () => {
    const virtualAccount = buildHealthReimbursementsVirtualAccount(transactions)

    expect(virtualAccount.balance).toBe(40)
  })

  it('should take reimbursements into account', () => {
    const virtualAccount = buildHealthReimbursementsVirtualAccount([
      {
        ...transactions[0],
        reimbursements: {
          data: [{ amount: 5 }]
        }
      },
      ...transactions.slice(1)
    ])

    expect(virtualAccount.balance).toBe(30)
  })

  it('should return a well formed account', () => {
    const expected = {
      _id: 'health_reimbursements',
      _type: 'io.cozy.bank.accounts',
      id: 'health_reimbursements',
      virtual: true,
      balance: expect.any(Number),
      label: 'Data.virtualAccounts.healthReimbursements',
      type: 'Reimbursements',
      currency: '€',
      categoryId: healthExpensesCategory
    }

    expect(buildHealthReimbursementsVirtualAccount(transactions)).toMatchObject(
      expected
    )
  })
})

describe('buildVirtualAccounts', () => {
  afterEach(() => {
    flag.mockReset()
  })

  const mockTransactions = fixtures['io.cozy.bank.operations'].slice(0, 5)

  it('should contain a health reimbursements virtual account', () => {
    const virtualAccounts = buildVirtualAccounts(mockTransactions)
    const healthReimbursementsAccount = virtualAccounts.find(
      a => a._id === 'health_reimbursements'
    )
    expect(healthReimbursementsAccount).toBeDefined()
  })

  it('should contain a professional expenses virtual account', () => {
    flag.mockReturnValue(true)
    const virtualAccounts = buildVirtualAccounts(mockTransactions)
    const professionalExpenseAccount = virtualAccounts.find(
      a => a._id === 'professional_reimbursements'
    )
    expect(professionalExpenseAccount).toBeDefined()
  })

  it('should contain a others expenses virtual account', () => {
    flag.mockReturnValue(true)
    const virtualAccounts = buildVirtualAccounts(mockTransactions)
    const othersExpenseAccount = virtualAccounts.find(
      a => a._id === 'others_reimbursements'
    )
    expect(othersExpenseAccount).toBeDefined()
  })

  it('should not build virtual accounts if there are no transactions', () => {
    flag.mockReturnValue(true)
    const virtualAccounts = buildVirtualAccounts([])
    expect(virtualAccounts.length).toBe(0)
  })
})

describe('addOwnerToAccount', () => {
  const owner = { _id: 'owner' }
  const ownerRel = { _id: owner._id, _type: CONTACT_DOCTYPE }

  describe('when the account is not already linked to the owner', () => {
    it('should add the owner to the account', () => {
      const otherOwner = { _id: 'otherowner', _type: CONTACT_DOCTYPE }
      const account = {
        relationships: {
          owners: {
            data: [otherOwner]
          }
        }
      }

      addOwnerToAccount(account, owner)
      expect(account.relationships.owners.data).toEqual([otherOwner, ownerRel])
    })
  })

  describe('when the account is already linked to the owner', () => {
    it('should not add the owner to the account', () => {
      const account = {
        relationships: {
          owners: {
            data: [ownerRel]
          }
        }
      }

      addOwnerToAccount(account, owner)
      expect(account.relationships.owners.data).toEqual([ownerRel])
    })
  })
})

describe('buildProfessionalReimbursementsVirtualAccount', () => {
  const professionalExpenseCategory = getCategoryIdFromName(
    'professionalExpenses'
  )

  const transactions = [
    {
      manualCategoryId: professionalExpenseCategory,
      amount: -10,
      date: '2019-01-02',
      reimbursementStatus: 'pending'
    },
    {
      manualCategoryId: professionalExpenseCategory,
      amount: -10,
      date: '2019-01-02',
      reimbursementStatus: 'pending'
    },
    {
      manualCategoryId: professionalExpenseCategory,
      amount: -10,
      date: '2019-01-02',
      reimbursementStatus: 'pending'
    },
    {
      manualCategoryId: professionalExpenseCategory,
      amount: -10,
      date: '2019-01-02',
      reimbursementStatus: 'pending'
    },
    {
      manualCategoryId: professionalExpenseCategory,
      amount: -10,
      date: '2018-01-02',
      reimbursementStatus: 'pending'
    },
    { manualCategoryId: '400470', amount: 10 }
  ]

  beforeEach(() => {
    MockDate.set(new Date('2019-04-08T00:00:00.000Z'))
  })

  it('should return a balance equals to 0 if there is no transaction', () => {
    const virtualAccount = buildProfessionalReimbursementsVirtualAccount([])
    expect(virtualAccount.balance).toBe(0)
  })

  it('should sum only last 6 months and professional expenses amounts', () => {
    const virtualAccount = buildProfessionalReimbursementsVirtualAccount(
      transactions
    )
    expect(virtualAccount.balance).toBe(40)
  })

  it('should return a well formed account', () => {
    const expected = {
      _id: 'professional_reimbursements',
      _type: 'io.cozy.bank.accounts',
      id: 'professional_reimbursements',
      virtual: true,
      balance: expect.any(Number),
      label: 'Data.virtualAccounts.professionalReimbursements',
      type: 'Reimbursements',
      currency: '€',
      categoryId: professionalExpenseCategory
    }

    expect(
      buildProfessionalReimbursementsVirtualAccount(transactions)
    ).toMatchObject(expected)
  })
})

describe('buildOthersReimbursementsVirtualAccount', () => {
  const professionalExpenseCategory = getCategoryIdFromName(
    'professionalExpenses'
  )
  const healthExpensesCategory = getCategoryIdFromName('healthExpenses')
  const telecomCategory = getCategoryIdFromName('telecom')

  const transactions = [
    {
      manualCategoryId: professionalExpenseCategory,
      amount: -10,
      date: '2019-01-02',
      reimbursementStatus: 'pending'
    },
    {
      manualCategoryId: healthExpensesCategory,
      amount: -10,
      date: '2019-01-02',
      reimbursementStatus: 'pending'
    },
    {
      manualCategoryId: telecomCategory,
      amount: -10,
      date: '2019-01-02',
      reimbursementStatus: 'pending'
    },
    {
      manualCategoryId: telecomCategory,
      amount: -10,
      date: '2019-01-02',
      reimbursementStatus: 'pending'
    },
    {
      manualCategoryId: telecomCategory,
      amount: -10,
      date: '2018-01-02',
      reimbursementStatus: 'pending'
    },
    { manualCategoryId: '400470', amount: 10 }
  ]

  beforeEach(() => {
    MockDate.set(new Date('2019-04-08T00:00:00.000Z'))
  })

  it('should return a balance equals to 0 if there is no transaction', () => {
    const virtualAccount = buildOthersReimbursementsVirtualAccount([])
    expect(virtualAccount.balance).toBe(0)
  })

  it('should sum only last 6 months and not professional nor health expenses amounts', () => {
    const virtualAccount = buildOthersReimbursementsVirtualAccount(transactions)
    expect(virtualAccount.balance).toBe(20)
  })

  it('should return a well formed account', () => {
    const expected = {
      _id: 'others_reimbursements',
      _type: 'io.cozy.bank.accounts',
      id: 'others_reimbursements',
      virtual: true,
      balance: expect.any(Number),
      label: 'Data.virtualAccounts.othersReimbursements',
      type: 'Reimbursements',
      currency: '€',
      categoryId: undefined
    }

    expect(buildOthersReimbursementsVirtualAccount(transactions)).toMatchObject(
      expected
    )
  })
})
