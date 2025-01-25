// eslint-disable-next-line import/no-commonjs
module.exports = {
  root: true,
  extends: ['@modern-js-app'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['../tsconfig.json'],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/restrict-plus-operands': 'warn',
      },
    },
    {
      files: ['ioc/ioc-types/*.ts', 'ioc/ioc-types/*/*.ts'],
      rules: {
        '@typescript-eslint/no-redeclare': 'off',
      },
    },
  ],
};
