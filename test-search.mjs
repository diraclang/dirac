import { SubroutineRegistry } from './dist/index.js';

const registry = new SubroutineRegistry();
const results = registry.search('show me youtube', 10);

console.log('Search results for "show me youtube":');
console.log('=====================================\n');

results.forEach(r => {
  console.log(`- ${r.name}`);
  console.log(`  File: ${r.filePath}`);
  console.log(`  Description: ${r.description}`);
  console.log();
});

console.log(`\nTotal results: ${results.length}`);
