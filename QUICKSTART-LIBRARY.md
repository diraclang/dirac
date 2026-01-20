# Quick Start: Publishing Your First Dirac Library

## 5-Minute Guide

### 1. Create Your Library (2 min)

```bash
mkdir dirac-mylibrary
cd dirac-mylibrary
```

Create `lib/index.di`:
```xml
<dirac>
<subroutine name="HELLO">
  <eval>
    const caller = getParams();
    const name = caller.attributes.name || 'World';
    console.log(`Hello, ${name}!`);
  </eval>
</subroutine>
</dirac>
```

### 2. Add package.json (1 min)

```bash
npm init -y
```

Edit to add:
```json
{
  "name": "dirac-mylibrary",
  "main": "lib/index.di",
  "keywords": ["dirac", "hello"]
}
```

### 3. Test It (1 min)

Create `test.di`:
```xml
<dirac>
  <import src="./lib/index.di"/>
  <HELLO name="Alice"/>
</dirac>
```

Run:
```bash
dirac test.di
```

### 4. Publish (1 min)

```bash
npm login
npm publish
```

Done! Others can now use:
```bash
npm install dirac-mylibrary
```

```xml
<import src="./node_modules/dirac-mylibrary/lib/index.di"/>
<HELLO name="World"/>
```

## Naming Convention

- **dirac-[domain]** - Core functionality (e.g., `dirac-http`, `dirac-crypto`)
- **@yourorg/dirac-[name]** - Organization packages
- **dirac-contrib-[name]** - Community contributions

## Where to Announce

1. **npm** - Automatically indexed
2. **GitHub** - Tag with `dirac-library` topic
3. **Discord/Forum** - #library-showcase channel (coming soon)
4. **awesome-dirac** - Submit PR to add your library
5. **Twitter/X** - Use #DiracLang hashtag

## Next Steps

See [COMMUNITY.md](COMMUNITY.md) for full details on:
- Quality standards
- Best practices
- Testing
- Documentation
- Community governance
