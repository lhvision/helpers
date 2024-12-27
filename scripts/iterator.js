// eslint-disable-next-line no-extend-native
Object.prototype[Symbol.iterator] = function* () {
  yield * Object.values(this)
}

const [a, b] = {
  a: 1,
  b: 2,
}

console.log(a, b)
