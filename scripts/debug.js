/* eslint-disable antfu/no-import-dist */
import { formatCountdown, getDayOfYear } from '../dist/index.js'
import { } from '../dist/upload.js'

console.log(formatCountdown(new Date('2024-11-10 00:00:00'), { showFull: true }))
console.log(getDayOfYear(new Date('2024-12-31')))
