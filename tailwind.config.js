/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom colors
        primary: "#1B1B1B",
        secondary: "#FFFFFF",
        strongest: "#000",

        success: '#23E69E',
        error: '#ED4949',
        link: '#4B68EE',
        
        support_primary: "#FABB5B",
        support_secondary: "#757575",

        gray_light: "#BBBBBB",
        gray_medium: "#858585",
        gray_strong: "#525252",

        // Dark Colors
        'dark-primary': '#1B1B1B',
        'dark-secondary': '#FABB5B',

        'dark-support-primary': '#2B2B2B',
        'dark-support-secondary': '#1B1B1B',

        'dark-gray-light': '#3B3B3B',
        'dark-gray-medium': '#5B5B5B',
        'dark-gray-strong': '#8B8B8B',
        'destination': '#7259FF'
      },
      fontFamily: {
        'poppins-thin': ['Poppins_100Thin'],
        'poppins-thin-italic': ['Poppins_100Thin_Italic'],
        'poppins-extralight': ['Poppins_200ExtraLight'],
        'poppins-extralight-italic': ['Poppins_200ExtraLight_Italic'],
        'poppins-light': ['Poppins_300Light'],
        'poppins-light-italic': ['Poppins_300Light_Italic'],
        'poppins-regular': ['Poppins_400Regular'],
        'poppins-regular-italic': ['Poppins_400Regular_Italic'],
        'poppins-medium': ['Poppins_500Medium'],
        'poppins-medium-italic': ['Poppins_500Medium_Italic'],
        'poppins-semibold': ['Poppins_600SemiBold'],
        'poppins-semibold-italic': ['Poppins_600SemiBold_Italic'],
        'poppins-bold': ['Poppins_700Bold'],
        'poppins-bold-italic': ['Poppins_700Bold_Italic'],
        'poppins-extrabold': ['Poppins_800ExtraBold'],
        'poppins-extrabold-italic': ['Poppins_800ExtraBold_Italic'],
        'poppins-black': ['Poppins_900Black'],
        'poppins-black-italic': ['Poppins_900Black_Italic'],
      },
    },
  },
  plugins: [],
}

