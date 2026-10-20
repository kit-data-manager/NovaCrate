import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import novacrate from "./eslint-rules/novacrate.mjs"

const eslintConfig = defineConfig([
    ...nextVitals,
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
        "public/**.js"
    ]),
    {
        // Enforce that the unlisten callback returned by IObservable.addEventListener
        // is used. Tests are excluded to keep the signal focused on app code; remove
        // the `ignores` to also lint test files. Bump severity to "error" once the
        // existing call sites are fixed.
        files: ["**/*.ts", "**/*.tsx"],
        ignores: ["tests/**"],
        plugins: { novacrate },
        rules: {
            "novacrate/use-add-event-listener-return": "warn"
        }
    },
    [
        {
            rules: {
                "react-hooks/refs": "warn",
                "react-hooks/set-state-in-effect": "off",
                "react-hooks/preserve-manual-memoization": "off"
            }
        }
    ]
])

export default eslintConfig
