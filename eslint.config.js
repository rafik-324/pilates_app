const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const colorLiteral = [
  {
    selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
    message: 'Farbliterale nur in src/ui/theme/ (palette.ts). Tokens über useTheme() verwenden.',
  },
  {
    selector: 'Literal[value=/^(rgb|rgba|hsl|hsla)\\(/]',
    message: 'Farbliterale nur in src/ui/theme/ (palette.ts). Tokens über useTheme() verwenden.',
  },
];

const styleLiteral = [
  {
    selector:
      'Property[key.name=/^(fontSize|fontFamily|lineHeight|fontWeight|margin.*|padding.*|gap|rowGap|columnGap|borderRadius|borderWidth)$/] > Literal.value[value!=0]',
    message:
      'Feste Schriftgrößen, Abstände und Radien sind in app/ und src/features/ verboten. Tokens aus useTheme() verwenden.',
  },
];

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*', 'node_modules/*', 'src/data/content/media.generated.ts'] },
  {
    files: ['**/*.{ts,tsx,js}'],
    ignores: ['src/ui/theme/**', '**/*.test.{ts,tsx}', 'eslint.config.js', 'scripts/**'],
    rules: { 'no-restricted-syntax': ['error', ...colorLiteral] },
  },
  {
    files: ['app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', ...colorLiteral, ...styleLiteral] },
  },
]);
