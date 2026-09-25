// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  globalIgnores(['dist/*', 'web-build/*', '.expo/*']),
  {
    rules: {
      // A web-HTML rule: React Native <Text> has no entity parsing, and React
      // escapes text nodes on web anyway.
      'react/no-unescaped-entities': 'off',
      // axios.create() / axios.isAxiosError() are the documented API.
      'import/no-named-as-default-member': 'off',
    },
  },
]);
