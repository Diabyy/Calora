import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Manrope', '"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
                display: ['"Barlow Condensed"', 'sans-serif'],
                athletic: ['"Barlow Condensed"', 'sans-serif'],
            },
            colors: {
                nike: {
                    volt: '#CCFF00',
                    lime: '#00E599',
                    dark: '#0A0E17',
                    surface: '#111827',
                },
                strava: {
                    orange: '#FC4C02',
                    coral: '#FF5500',
                },
            },
        },
    },

    plugins: [forms],
};
