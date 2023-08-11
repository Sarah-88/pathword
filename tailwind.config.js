/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            boxShadow: {
                'box': 'var(--theme-2-dark) 0 2px inset, var(--theme-2) 0 0 0 10px',
                'button': 'var(--theme-3) 1px 2px 0 0px'
            },
            backgroundImage: {
                'easy-1': 'url("/images/easy1.png")',
                'easy-2': 'url("/images/easy2.png")',
                'normal-1': 'url("/images/normal1.png")',
                'normal-2': 'url("/images/normal2.png")',
                'hard-1': 'url("/images/hard1.png")',
                'hard-2': 'url("/images/hard2.png")'
            }
        },
    },
    plugins: [],
}

