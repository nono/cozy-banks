import React from 'react'
import styles from './styles.styl'
import { Input } from 'cozy-ui/transpiled/react'
import cx from 'classnames'

const OptionalInput = ({ className, ...props }) => {
  return <Input {...props} className={cx(styles.OptionalInput, className)} />
}

export default OptionalInput
