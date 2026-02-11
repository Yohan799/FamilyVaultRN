/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(250, 30%, 90%)",
                input: "hsl(250, 30%, 94%)",
                ring: "hsl(220, 100%, 60%)",
                background: "hsl(250, 100%, 97%)",
                foreground: "hsl(250, 15%, 15%)",
                primary: {
                    DEFAULT: "hsl(220, 100%, 60%)",
                    foreground: "hsl(0, 0%, 100%)",
                },
                secondary: {
                    DEFAULT: "hsl(250, 60%, 95%)",
                    foreground: "hsl(250, 15%, 15%)",
                },
                destructive: {
                    DEFAULT: "hsl(0, 84.2%, 60.2%)",
                    foreground: "hsl(0, 0%, 100%)",
                },
                muted: {
                    DEFAULT: "hsl(250, 40%, 96%)",
                    foreground: "hsl(250, 10%, 50%)",
                },
                accent: {
                    DEFAULT: "hsl(220, 80%, 95%)",
                    foreground: "hsl(220, 100%, 60%)",
                },
                card: {
                    DEFAULT: "hsl(0, 0%, 100%)",
                    foreground: "hsl(250, 15%, 15%)",
                },
                vault: {
                    blue: "hsl(220, 100%, 60%)",
                    "blue-light": "hsl(220, 80%, 95%)",
                    "blue-dark": "hsl(220, 100%, 50%)",
                    bg: "hsl(250, 100%, 97%)",
                },
            },
            borderRadius: {
                lg: "16px",
                md: "14px",
                sm: "12px",
            },
            fontFamily: {
                sans: ["Inter", "System"],
            },
        },
    },
    plugins: [],
};
