import next from "eslint-config-next"

// eslint-config-next v16 ships native flat-config arrays. The main entry
// bundles next/core-web-vitals + next/typescript, so we spread it directly
// (no FlatCompat shim needed, and `next lint` is removed in Next 16).
const eslintConfig = [
  ...next,
  { ignores: [".next/**", "node_modules/**"] },
]

export default eslintConfig
