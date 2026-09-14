import { ChangeEvent, HTMLAttributes, InputHTMLAttributes, useState } from 'react'
import { type SettingsField } from '@renderer/common/Settings'
import styles from './fields.module.css'

export const ColorField: SettingsField<string> = ({
  value,
  callback,
  ...rest
}: {
  value: string
  callback: (value: string) => void
} & HTMLAttributes<HTMLInputElement>) => {
  const [visibleValue, setVisibleValue] = useState(value)

  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>): void => {
    setVisibleValue(e.currentTarget.value)
    if (!CSS.supports('color', e.currentTarget.value)) return
    callback(e.currentTarget.value)
  }

  return (
    <div className={styles.inputs}>
      <input type="text" maxLength={16} onChange={onChangeHandler} value={visibleValue} {...rest} />
      <input type="color" value={value} onChange={onChangeHandler} />
    </div>
  )
}

export const RangeField: SettingsField<number> = ({
  value,
  callback,
  ...rest
}: {
  value: number
  callback: (value: number) => void
} & InputHTMLAttributes<HTMLInputElement>) => {
  const [visibleValue, setVisibleValue] = useState(value.toString())

  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>): void => {
    setVisibleValue(e.currentTarget.value)
    if (isNaN(Number.parseInt(e.currentTarget.value))) return
    callback(Number.parseInt(e.currentTarget.value))
  }

  return (
    <div className={styles.inputs}>
      <input type="range" onChange={onChangeHandler} value={value} {...rest} />
      <input type="number" onChange={onChangeHandler} value={visibleValue} {...rest} />
    </div>
  )
}
