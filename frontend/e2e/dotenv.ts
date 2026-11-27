// Reads a .env file the way Docker Compose does, so the e2e backend gets the same dev DB
// password that backend/docker-compose.yml gave Postgres:
// - `export ` prefixes are dropped and blank lines and `#` lines skipped;
// - single quotes are literal; double quotes take backslash escapes and `$` interpolation;
// - unquoted values lose a trailing ` # comment` and surrounding spaces, then are interpolated;
// - `$$` is a literal `$`; `$VAR`, `${VAR}`, `${VAR:-default}` and `${VAR-default}` read
//   variables defined earlier in the file, then the process environment.
// Multi-line values are not supported (nothing here needs them).

type Lookup = (name: string) => string | undefined;

const VARIABLE = /\$(?:(\$)|\{(\w+)(?:(:?-)([^}]*))?\}|(\w+))/g;
const ESCAPE_OR_VARIABLE = /\\(.)|\$(?:(\$)|\{(\w+)(?:(:?-)([^}]*))?\}|(\w+))/g;
const ESCAPES: Record<string, string> = { n: '\n', r: '\r', t: '\t' };

function expand(
  lookup: Lookup,
  dollar: string | undefined,
  braced: string | undefined,
  op: string | undefined,
  fallback: string | undefined,
  bare: string | undefined,
): string {
  if (dollar) return '$';
  const value = lookup((braced ?? bare)!);
  if (op === ':-' && !value) return fallback ?? '';
  if (op === '-' && value === undefined) return fallback ?? '';
  return value ?? '';
}

function parseValue(raw: string, lookup: Lookup): string {
  const value = raw.trim();
  const single = value.match(/^'([^']*)'/);
  if (single) return single[1];
  const double = value.match(/^"((?:[^"\\]|\\.)*)"/);
  if (double) {
    return double[1].replace(ESCAPE_OR_VARIABLE, (_, escaped, ...rest) =>
      escaped !== undefined ? (ESCAPES[escaped] ?? escaped) : expand(lookup, rest[0], rest[1], rest[2], rest[3], rest[4]),
    );
  }
  return value
    .replace(/\s+#.*$/, '')
    .replace(VARIABLE, (_, ...rest) => expand(lookup, rest[0], rest[1], rest[2], rest[3], rest[4]));
}

export function parseDotenv(text: string, env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const vars: Record<string, string> = {};
  const lookup: Lookup = (name) => (name in vars ? vars[name] : env[name]);
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=(.*)$/);
    if (match) vars[match[1]] = parseValue(match[2], lookup);
  }
  return vars;
}
