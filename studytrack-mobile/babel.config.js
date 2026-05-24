module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // jsEngine:"jsc" → babel-preset-expo hermes-v0 profilini kullanır.
      // hermes-v0 zaten class-properties + private-methods dönüşümlerini
      // içerdiği için burada tekrar tanımlamak gerekmez.
      //
      // ⚠️ react-native-reanimated/plugin MUTLAKA EN SONDA olmak zorunda.
      'react-native-reanimated/plugin',
    ],
  }
}
