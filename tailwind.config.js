/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        sm: "500px",    // phone → tablet breakpoint
        // md: 768px   (Tailwind default)
        lg: "1025px",  // tablet → desktop (excludes iPad Pro at 1024px)
      },
    },
  },
  plugins: [],
}

