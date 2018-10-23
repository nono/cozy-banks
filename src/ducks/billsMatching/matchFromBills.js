import { cozyClient } from 'cozy-konnector-libs'
import Linker from './Linker/Linker'
import { DEFAULT_PAST_WINDOW, DEFAULT_FUTURE_WINDOW } from './Linker/Linker'
import { getBillDate } from './utils'
import { max, min } from 'lodash'
import { format as formatDate, subDays, addDays } from 'date-fns'
import { queryAll } from './utils'
import { TRANSACTION_DOCTYPE } from 'doctypes'

const DATE_FORMAT = 'YYYY-MM-DD'

export default async function matchFromBills(bills) {
  const billsDates = bills.map(bill => getBillDate(bill))
  const dateMin = subDays(min(billsDates), DEFAULT_PAST_WINDOW)
  const dateMax = addDays(max(billsDates), DEFAULT_FUTURE_WINDOW)

  const selector = {
    date: {
      $gt: formatDate(dateMin, DATE_FORMAT),
      $lt: formatDate(dateMax, DATE_FORMAT)
    }
  }

  const transactions = await queryAll(TRANSACTION_DOCTYPE, selector)

  const linker = new Linker(cozyClient)
  const results = await linker.linkBillsToOperations(bills, transactions)

  return results
}
