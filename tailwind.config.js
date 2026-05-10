/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/views/**/*.ejs", // Pastikan ada ** agar folder 'leave' terbaca
    "./src/public/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
