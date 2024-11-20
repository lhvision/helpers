/* eslint-disable antfu/no-import-dist */
import * as helpers from '../dist/index.js'
import * as upload from '../dist/upload.js'

// 获取所有导出的函数名和类型
const helperNames = Object.keys(helpers)
const uploadNames = Object.keys(upload)

function helpersPreset() {
  return [
    {
      '@lhvision/helpers': helperNames,
      '@lhvision/helpers/upload': uploadNames,
    },
    {
      from: '@lhvision/helpers',
      imports: [
        'TabCommunicationMessage',
        'DataOnlyConfig',
        'FullResponseConfig',
        'RawResponseConfig',
        'RequestOptions',
        'RequestResponse',
        'ResponseTypeConfig',
      ],
      type: true,
    },
    {
      from: '@lhvision/helpers/upload',
      imports: [
        'ChunkHashResult',
        'ChunkWorkerMessage',
      ],
      type: true,
    },
  ]
}

console.log(helpersPreset())
