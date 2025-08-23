// postcss.config.cjs (CommonJS)
const tailwind = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    tailwind({ config: './tailwind.config.js' }), // <- forzado
    autoprefixer(),
  ],
};