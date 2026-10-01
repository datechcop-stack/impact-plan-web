import { defineConfig } from "orval";

export default defineConfig({
  impactPlan: {
    input: {
      target: process.env.OPENAPI_URL ?? "http://localhost:4000/openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "src/lib/api/generated",
      schemas: "src/lib/api/generated/models",
      client: "react-query",
      override: {
        mutator: {
          path: "src/lib/api/mutator.ts",
          name: "customFetch",
        },
      },
    },
  },
});
