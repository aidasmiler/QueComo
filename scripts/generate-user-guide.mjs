// Generates docs/user-guide/*.md from the in-app help (src/i18n/locales/*/help.json and the
// install steps in profile.json), so the repository guides and the in-app help never diverge.
// Usage: node scripts/generate-user-guide.mjs [--check]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const locales = ['es-ES', 'en-GB'];
const load = (locale, ns) =>
  JSON.parse(readFileSync(join(root, 'src', 'i18n', 'locales', locale, `${ns}.json`), 'utf8'));

const guides = {
  'GETTING_STARTED.md': ['gettingStarted'],
  'HOUSEHOLDS.md': ['households', 'invitations'],
  'RECIPES.md': ['recipes', 'servings', 'equipment', 'history'],
  'INSTALLATION.md': ['install'],
  'SETTINGS.md': ['language'],
  'FAQ.md': ['faq'],
};

function render(file, articles) {
  const parts = [
    '<!-- Generado por scripts/generate-user-guide.mjs desde la ayuda de la app. No editar a mano. -->',
  ];
  for (const locale of locales) {
    const help = load(locale, 'help');
    const profile = load(locale, 'profile');
    parts.push('', `## ${locale === 'es-ES' ? 'Español' : 'English'}`);
    for (const key of articles) {
      const article = help.articles[key];
      parts.push(
        '',
        `### ${article.title}`,
        '',
        ...article.body.flatMap((p) => [p, '']).slice(0, -1),
      );
      if (key === 'install') {
        for (const platform of ['ios', 'android', 'desktop']) {
          const guide = profile.installGuide[platform];
          parts.push('', `#### ${guide.title}`, '', ...guide.steps.map((s, i) => `${i + 1}. ${s}`));
        }
      }
    }
  }
  return `# ${file.replace('.md', '').replaceAll('_', ' ')}\n\n${parts.join('\n')}\n`;
}

let stale = false;
for (const [file, articles] of Object.entries(guides)) {
  const path = join(root, 'docs', 'user-guide', file);
  const content = render(file, articles);
  if (process.argv.includes('--check')) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== content) {
      console.error(
        `✗ docs/user-guide/${file} is out of date. Run: node scripts/generate-user-guide.mjs`,
      );
      stale = true;
    }
  } else {
    writeFileSync(path, content);
    console.log(`✓ docs/user-guide/${file}`);
  }
}
if (stale) process.exit(1);
