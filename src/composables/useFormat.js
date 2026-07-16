import { TIME_KEYS } from '@/stores/dataStore'

export function fmtTimeVal(k, v) {
  if (TIME_KEYS.has(k) && typeof v === 'number' && v > 0) {
    const s = v / 1000
    return (s % 1 === 0 ? s.toFixed(0) : s.toFixed(1)) + 's'
  }
  return v
}