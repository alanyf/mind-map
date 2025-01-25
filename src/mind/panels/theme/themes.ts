const colors1: string[] = [
  '#191959',
  '#4a51d9',
  '#8bb5ff',
  '#ff7b31',
  '#ffabaa',
  '#4a96d9',
];

const colors2: string[] = [
  '#6b3747',
  '#f9633f',
  '#35c290',
  '#7fc0f8',
  '#e1e1d5',
  '#85c1d3',
];

export interface ColorTheme {
  name: string;
  colors: string[];
}

export const colorThemes: ColorTheme[] = [
  {
    name: '主题1',
    colors: colors1,
  },
  {
    name: '主题2',
    colors: colors2,
  },
];
