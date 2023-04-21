module.exports = {
  mode: "jit",
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        primary: "#3B82F6",
        secondary: "#FBBF24",
        tertiary: "#F87171",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
