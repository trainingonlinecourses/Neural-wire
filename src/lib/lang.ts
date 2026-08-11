/** GitHub language → dot color. Ported from index.html `LANG_COLORS`. */
export const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  'Jupyter Notebook': '#DA5B0B',
  Rust: '#dea584',
  Go: '#00ADD8',
  'C++': '#f34b7d',
  C: '#555555',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C#': '#178600',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Zig: '#ec915c',
  Lua: '#000080',
  Julia: '#a270ba',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
};

export function langColor(lang: string | null | undefined): string {
  return (lang && LANG_COLORS[lang]) || '#8b95ab';
}
