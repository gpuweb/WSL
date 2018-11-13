export default {
  entry: 'Scripts/rollup.js',
  dest: 'rollup_browser/whlsl.js',
  format: 'iife',
  name: "WHLSL", // var WHLSL = (function (exports) { ... }
  sourceMap: 'inline',
};