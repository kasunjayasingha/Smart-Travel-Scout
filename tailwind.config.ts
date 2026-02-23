import type { Config } from "tailwindcss";

const config: Config = {
    // Only scan files that actually use Tailwind classes.
    // Our design system is pure custom CSS, so this content array is intentionally
    // minimal — Tailwind is present for its PostCSS pipeline (autoprefixer, resets)
    // and for any utility classes components may use.
    content: [
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};

export default config;
