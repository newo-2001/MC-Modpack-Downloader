import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        exclude: ["test/e2e/**/*.spec.ts"],
        include: ["test/**/*.spec.ts"],
        coverage: {
            reporter: "json-summary"
        }
    }
});