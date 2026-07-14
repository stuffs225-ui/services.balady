import { describe, expect, it } from 'vitest'
import { publicNavItems, dateSettingOptions } from './publicNavigation'

describe('publicNavItems', () => {
  it('never points at an external domain', () => {
    for (const item of publicNavItems) {
      if (item.kind === 'internal' || item.kind === 'local-anchor') {
        expect(item.href.startsWith('/') || item.href.startsWith('#')).toBe(true)
      }
    }
  })

  it('exposes print, settings, and accessibility as local actions only', () => {
    const actionLabels = publicNavItems
      .filter((item) => item.kind === 'action')
      .map((item) => item.label)
    expect(actionLabels).toEqual(
      expect.arrayContaining(['الإعدادات', 'أدوات سهولة الوصول', 'الطباعة']),
    )
  })
})

describe('dateSettingOptions', () => {
  it('offers exactly hijri and gregorian preferences', () => {
    expect(dateSettingOptions.map((option) => option.value).sort()).toEqual([
      'gregorian',
      'hijri',
    ])
  })
})
