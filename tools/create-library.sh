#!/bin/bash
# Create a new Dirac library with proper structure

if [ -z "$1" ]; then
  echo "Usage: ./create-library.sh <library-name>"
  echo "Example: ./create-library.sh crypto"
  exit 1
fi

LIBNAME="$1"
DIRNAME="dirac-$LIBNAME"
LIBNAME_UPPER=$(echo "$LIBNAME" | tr '[:lower:]' '[:upper:]')

echo "Creating Dirac library: $DIRNAME"
echo "Prefix convention: ${LIBNAME_UPPER}_"
echo ""

# Create directory structure
mkdir -p "$DIRNAME"/{lib,examples,tests}

# Create package.json
cat > "$DIRNAME/package.json" << EOF
{
  "name": "dirac-$LIBNAME",
  "version": "0.1.0",
  "description": "$LIBNAME library for Dirac",
  "main": "lib/index.di",
  "scripts": {
    "test": "dirac tests/test.di",
    "example": "dirac examples/demo.di"
  },
  "keywords": [
    "dirac",
    "$LIBNAME"
  ],
  "author": "",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/dirac-$LIBNAME"
  },
  "dirac": {
    "version": ">=0.1.0"
  }
}
EOF

# Create lib/index.di
cat > "$DIRNAME/lib/index.di" << 'DIRAC_EOF'
<dirac>

<!-- All tags use the library prefix to avoid naming conflicts -->
<subroutine name="LIBPREFIX_EXAMPLE">
  <eval>
    const caller = getParams();
    const input = caller.attributes.input || 'no input';
    console.log('Processed: ' + input);
  </eval>
</subroutine>

</dirac>
DIRAC_EOF

# Replace the placeholder with actual library name
sed -i '' "s/LIBPREFIX_/${LIBNAME_UPPER}_/g" "$DIRNAME/lib/index.di"

# Create examples/demo.di
cat > "$DIRNAME/examples/demo.di" << EOF
#!/usr/bin/env dirac
<dirac>
  <import src="../lib/index.di"/>

  <output>Demo:&#10;</output>
  <${LIBNAME_UPPER}_EXAMPLE input="test"/>
</dirac>
EOF

chmod +x "$DIRNAME/examples/demo.di"

# Create tests/test.di
cat > "$DIRNAME/tests/test.di" << 'EOF'
#!/usr/bin/env dirac
<dirac>
  <import src="../lib/index.di"/>

  <output>Running tests...&#10;</output>
  <EXAMPLE input="test"/>
  <output>Tests passed!&#10;</output>
</dirac>
EOF

chmod +x "$DIRNAME/tests/test.di"

# Create README.md
cat > "$DIRNAME/README.md" << EOF
# dirac-$LIBNAME

$LIBNAME library for Dirac.

## Installation

\`\`\`bash
npm install dirac-$LIBNAME
\`\`\`

## Usage

\`\`\`xml
<dirac>
  <import src="./node_modules/dirac-$LIBNAME/lib/index.di"/>
  
  <EXAMPLE input="hello"/>
</dirac>
\`\`\`

## API

### EXAMPLE

**Attributes:**
- \`input\` (string) - Input text

## Development

\`\`\`bash
# Run examples
npm run example

# Run tests
npm test
\`\`\`

## License

MIT
EOF

# Create .gitignore
cat > "$DIRNAME/.gitignore" << 'EOF'
node_modules/
.DS_Store
*.log
EOF

# Create LICENSE
cat > "$DIRNAME/LICENSE" << 'EOF'
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

echo "✅ Library created: $DIRNAME/"
echo ""
echo "Next steps:"
echo "  cd $DIRNAME"
echo "  npm run example    # Test your library"
echo "  npm test          # Run tests"
echo "  git init          # Initialize git"
echo "  npm publish       # Publish to npm"
