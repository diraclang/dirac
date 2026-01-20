# Dirac Community Library Ecosystem

## Publishing a Library

### Step 1: Create Your Library

Create a repository structure:
```
my-dirac-library/
├── package.json          # npm metadata
├── README.md            # Documentation
├── lib/
│   ├── main.di          # Your subroutines
│   └── utils.di         # Helper functions
├── examples/
│   └── demo.di          # Usage examples
└── tests/
    └── test.di          # Tests
```

### Step 2: Follow Naming Convention

**CRITICAL: Prevent conflicts with prefixes**

All library tags MUST use a prefix:
- Package: `dirac-http` → Prefix: `HTTP_`
- Package: `dirac-crypto` → Prefix: `CRYPTO_`
- Example: `<HTTP_GET/>`, `<CRYPTO_SHA256/>`

### Step 3: Add package.json

```json
{
  "name": "dirac-crypto",
  "version": "1.0.0",
  "description": "Cryptography library for Dirac",
  "main": "lib/main.di",
  "keywords": ["dirac", "crypto", "hash"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/dirac-crypto"
  },
  "dirac": {
    "version": ">=0.1.0",
    "exports": {
      "main": "lib/main.di",
      "utils": "lib/utils.di"
    },
    "dependencies": {}
  }
}
```

### Step 3: Publish

#### Option A: npm (Recommended)
```bash
npm login
npm publish
```

Users install:
```bash
npm install dirac-crypto
```

Use:
```xml
<import src="./node_modules/dirac-crypto/lib/main.di"/>
<SHA256 text="hello world"/>
```

#### Option B: GitHub
```bash
git tag v1.0.0
git push --tags
```

Users install:
```bash
npm install github:username/dirac-crypto
```

#### Option C: Dirac Registry (Future)
```bash
dirac publish
```

Users install:
```bash
dirac install crypto
```

Use:
```xml
<import src="@dirac/crypto/main"/>
```

## Discovery Mechanisms

### 1. npm with "dirac-" prefix

Convention: All Dirac libraries use `dirac-` prefix:
- `dirac-http` - HTTP client
- `dirac-db` - Database operations  
- `dirac-ml` - Machine learning
- `dirac-crypto` - Cryptography

Search on npm:
```bash
npm search dirac-
```

### 2. GitHub Topics

Tag repos with:
- `dirac`
- `dirac-library`
- `mask-language`

Browse: https://github.com/topics/dirac-library

### 3. Central Registry Website

Create `diraclibs.org`:
- **Browse** libraries by category
- **Search** by functionality
- **Ratings** and downloads
- **Documentation** for each library
- **Examples** and tutorials

### 4. CLI Discovery

```bash
dirac search "http client"
dirac info dirac-http
dirac install dirac-http
```

## Quality Standards

### Verified Libraries

Libraries can be "verified" by passing:

1. **Tests** - Automated test suite
2. **Documentation** - README with examples
3. **Compatibility** - Works with current Dirac version
4. **Security** - No malicious code (automated scan)
5. **Community** - Downloads, stars, issues resolved

Badge in README:
```markdown
![Dirac Verified](https://img.shields.io/badge/dirac-verified-green)
```

### Library Template

Provide starter template:
```bash
dirac create-lib my-library
```

Generates:
```
my-library/
├── package.json
├── README.md
├── lib/
│   └── index.di
├── examples/
│   └── example.di
├── tests/
│   └── test.di
└── .github/
    └── workflows/
        └── test.yml    # Auto-test on push
```

## Version Management

### Semantic Versioning

Follow semver for library versions:
- `1.0.0` - Initial release
- `1.1.0` - New subroutines (backward compatible)
- `2.0.0` - Breaking changes

### Dependency Resolution

In `package.json`:
```json
{
  "dirac": {
    "dependencies": {
      "dirac-utils": "^1.0.0",
      "dirac-http": "^2.1.0"
    }
  }
}
```

Install with:
```bash
npm install
```

### Import from Dependencies

```xml
<!-- Import from node_modules -->
<import src="./node_modules/dirac-http/lib/main.di"/>

<!-- Or use a helper tag (future) -->
<import package="dirac-http"/>
```

## Community Governance

### 1. Core Standard Library

Official libraries maintained by Dirac team:
- `@dirac/stdlib` - Standard library
- `@dirac/test` - Testing framework
- `@dirac/docs` - Documentation generator

Published under `@dirac` scope on npm.

### 2. Community Libraries

Anyone can publish `dirac-*` packages:
- Use npm's existing infrastructure
- No approval needed
- Free innovation

### 3. Awesome List

Maintain `awesome-dirac` repo:
```markdown
# Awesome Dirac

## HTTP & Networking
- [dirac-http](https://github.com/user/dirac-http) - HTTP client
- [dirac-websocket](https://github.com/user/dirac-ws) - WebSocket

## Data Processing
- [dirac-json](https://github.com/user/dirac-json) - JSON parser
- [dirac-csv](https://github.com/user/dirac-csv) - CSV operations

## Machine Learning
- [dirac-ml](https://github.com/user/dirac-ml) - ML toolkit
```

### 4. Discord/Forum

Community channels:
- **#library-showcase** - Share new libraries
- **#help** - Get support
- **#development** - Discuss features
- **#security** - Report issues

## Example: Publishing dirac-http

### 1. Create Library

`lib/main.di`:
```xml
<dirac>

<subroutine name="HTTP_GET">
  <eval>
    const caller = getParams();
    const url = caller.attributes.url;
    const response = await fetch(url);
    const text = await response.text();
    console.log(text);
  </eval>
</subroutine>

<subroutine name="HTTP_POST">
  <eval>
    const caller = getParams();
    const url = caller.attributes.url;
    const body = caller.attributes.body || '';
    const response = await fetch(url, {
      method: 'POST',
      body: body
    });
    const text = await response.text();
    console.log(text);
  </eval>
</subroutine>

</dirac>
```

### 2. Create package.json

```json
{
  "name": "dirac-http",
  "version": "1.0.0",
  "description": "HTTP client for Dirac",
  "main": "lib/main.di",
  "keywords": ["dirac", "http", "fetch", "rest"],
  "author": "Community Member",
  "license": "MIT",
  "repository": "github:username/dirac-http",
  "dirac": {
    "version": ">=0.1.0"
  }
}
```

### 3. Create README.md

```markdown
# dirac-http

HTTP client library for Dirac.

## Installation

\`\`\`bash
npm install dirac-http
\`\`\`

## Usage

\`\`\`xml
<import src="./node_modules/dirac-http/lib/main.di"/>

<HTTP_GET url="https://api.github.com/users/octocat"/>

<HTTP_POST 
  url="https://httpbin.org/post" 
  body='{"key":"value"}'/>
\`\`\`

## API

### HTTP_GET
Get a URL.

**Attributes:**
- `url` - URL to fetch (required)

### HTTP_POST  
Post to a URL.

**Attributes:**
- `url` - URL to post to (required)
- `body` - Request body (optional)
```

### 4. Publish

```bash
npm login
npm publish
```

### 5. Users Install & Use

```bash
npm install dirac-http
```

```xml
<import src="./node_modules/dirac-http/lib/main.di"/>
<HTTP_GET url="https://example.com"/>
```

## Future Enhancements

### 1. Dirac Package Manager

```bash
dirac init                    # Initialize project
dirac add http                # Add library
dirac remove http             # Remove library
dirac list                    # List installed
dirac search "machine learning"  # Search registry
dirac publish                 # Publish library
```

### 2. Smart Imports

```xml
<!-- Current -->
<import src="./node_modules/dirac-http/lib/main.di"/>

<!-- Future -->
<import package="http"/>           <!-- From installed packages -->
<import from="http" names="GET"/>  <!-- Named imports -->
<import src="https://cdn.dirac.org/http/1.0.0/main.di"/>  <!-- CDN -->
```

### 3. Type System (Optional)

```xml
<subroutine name="ADD" params="(x: number, y: number) -> number">
  <expr eval="plus">
    <arg><parameters select="@x"/></arg>
    <arg><parameters select="@y"/></arg>
  </expr>
</subroutine>
```

### 4. Testing Framework

```xml
<import src="@dirac/test"/>

<test name="ADD works correctly">
  <assert>
    <expr eval="eq">
      <arg><ADD x="1" y="2"/></arg>
      <arg>3</arg>
    </expr>
  </assert>
</test>
```

## Community Growth Phases

### Phase 1: Bootstrap (Month 1-3)
- ✅ Core interpreter working
- ✅ Basic examples
- Create 5-10 core libraries
- Set up GitHub org
- Launch Discord

### Phase 2: Early Adopters (Month 4-6)
- npm publishing convention
- awesome-dirac list
- Tutorial videos
- First community libraries

### Phase 3: Growth (Month 7-12)
- 50+ libraries on npm
- diraclibs.org registry
- Conference talks
- Plugin for VS Code

### Phase 4: Maturity (Year 2+)
- 200+ libraries
- Dirac package manager
- Corporate adoption
- Certification program

## Getting Started Contributing

1. **Pick a domain**: crypto, http, db, ml, etc.
2. **Check existing**: Search npm for `dirac-*`
3. **Create library**: Use template
4. **Test thoroughly**: Write examples
5. **Document well**: README + examples
6. **Publish**: npm publish
7. **Announce**: Discord + GitHub discussions
8. **Maintain**: Respond to issues

The ecosystem grows organically as developers scratch their own itches!
