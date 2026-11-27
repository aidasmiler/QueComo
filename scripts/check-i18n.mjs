// Verifies that every locale has exactly the same translation keys as the default locale (es-ES)
// and that no value is empty. Runs in CI (npm run i18n:check).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'src', 'i18n', 'locales');
const base = 'es-ES';
const locales = readdirSync(root);
let errors = 0;

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) return [[path, value.length ? 'array' : '']];
    if (value && typeof value === 'object') return flatten(value, path);
    return [[path, typeof value === 'string' ? value.trim() : String(value)]];
  });
}

function load(locale, file) {
  return Object.fromEntries(flatten(JSON.parse(readFileSync(join(root, locale, file), 'utf8'))));
}

const files = readdirSync(join(root, base));
for (const locale of locales) {
  const localeFiles = readdirSync(join(root, locale));
  for (const file of new Set([...files, ...localeFiles])) {
    if (!files.includes(file) || !localeFiles.includes(file)) {
      console.error(`✗ ${locale}/${file}: namespace missing in one of the locales`);
      errors++;
      continue;
    }
    const ref = load(base, file);
    const cur = load(locale, file);
    for (const key of Object.keys(ref)) {
      if (!(key in cur)) {
        console.error(`✗ ${locale}/${file}: missing key "${key}"`);
        errors++;
      } else if (!cur[key]) {
        console.error(`✗ ${locale}/${file}: empty value for "${key}"`);
        errors++;
      }
    }
    for (const key of Object.keys(cur)) {
      if (!(key in ref)) {
        console.error(`✗ ${locale}/${file}: extra key "${key}" not present in ${base}`);
        errors++;
      }
    }
  }
}

if (errors) {
  console.error(`\n${errors} translation problem(s) found.`);
  process.exit(1);
}
console.log(`✓ Translations complete for ${locales.join(', ')} (${files.length} namespaces).`);
