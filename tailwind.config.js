// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['*'],
  purge: {
    enabled: true,
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    options: {
      safelist: [],
    },
  },
  theme: {
    colors: {
      ...colors,
    },
    extend: {},
  },
  variants: [],
  plugins: [],
};

