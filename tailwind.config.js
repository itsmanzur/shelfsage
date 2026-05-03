export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./templates/**/*.php",
    "./includes/**/*.php"
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
        fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            serif: ['Lora', 'Georgia', 'serif'],
        },
    },
  },
  plugins: [],
}
