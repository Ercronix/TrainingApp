// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  globalIgnores(['dist/*', 'web-build/*', '.expo/*', 'e2e/.dist/*', 'e2e/.results/*', 'e2e/.report/*']),
  {
    rules: {
      // A web-HTML rule: React Native <Text> has no entity parsing, and React
      // escapes text nodes on web anyway.
      'react/no-unescaped-entities': 'off',
      // axios.create() / axios.isAxiosError() are the documented API.
      'import/no-named-as-default-member': 'off',
      // React Compiler diagnostics added in eslint-plugin-react-hooks 7. The app doesn't use the
      // compiler, and the RN idiom `useRef(new Animated.Value(0)).current` trips `refs` throughout.
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Playwright fixtures take `use` and an often empty `{}` of other fixtures; neither is React
    files: ['e2e/**/*.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'no-empty-pattern': 'off',
    },
  },
]);
