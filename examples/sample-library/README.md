# dirac-string

String manipulation library for Dirac.

![npm version](https://img.shields.io/npm/v/dirac-string)
![license](https://img.shields.io/npm/l/dirac-string)

## Installation

```bash
npm install dirac-string
```

## Usage

```xml
<dirac>
  <import src="./node_modules/dirac-string/lib/index.di"/>
  
  <UPPERCASE text="hello world"/>
  <!-- Outputs: HELLO WORLD -->
  
  <LOWERCASE text="HELLO WORLD"/>
  <!-- Outputs: hello world -->
  
  <SUBSTRING text="Hello World" start="0" end="5"/>
  <!-- Outputs: Hello -->
</dirac>
```

## API Reference

### UPPERCASE
Convert text to uppercase.

**Attributes:**
- `text` (string, required) - Text to convert

**Example:**
```xml
<UPPERCASE text="hello"/>
<!-- Output: HELLO -->
```

### LOWERCASE  
Convert text to lowercase.

**Attributes:**
- `text` (string, required) - Text to convert

**Example:**
```xml
<LOWERCASE text="WORLD"/>
<!-- Output: world -->
```

### TRIM
Remove leading and trailing whitespace.

**Attributes:**
- `text` (string, required) - Text to trim

**Example:**
```xml
<TRIM text="  hello  "/>
<!-- Output: hello -->
```

### SUBSTRING
Extract a substring.

**Attributes:**
- `text` (string, required) - Source text
- `start` (number, required) - Start index (0-based)
- `end` (number, optional) - End index (exclusive)

**Example:**
```xml
<SUBSTRING text="Hello World" start="6" end="11"/>
<!-- Output: World -->
```

### REPLACE
Replace all occurrences of a pattern.

**Attributes:**
- `text` (string, required) - Source text
- `find` (string, required) - Pattern to find (regex)
- `replace` (string, required) - Replacement text

**Example:**
```xml
<REPLACE text="Hello World" find="World" replace="Dirac"/>
<!-- Output: Hello Dirac -->
```

### SPLIT
Split text into array.

**Attributes:**
- `text` (string, required) - Text to split
- `delimiter` (string, optional) - Delimiter (default: ",")

**Example:**
```xml
<SPLIT text="a,b,c" delimiter=","/>
<!-- Output: ["a","b","c"] -->
```

### LENGTH
Get string length.

**Attributes:**
- `text` (string, required) - Text to measure

**Example:**
```xml
<LENGTH text="Hello"/>
<!-- Output: 5 -->
```

## Development

```bash
# Clone repository
git clone https://github.com/dirac-lang/dirac-string
cd dirac-string

# Run examples
dirac examples/demo.di

# Run tests
npm test
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT © Dirac Community

## Links

- [Dirac Language](https://github.com/wangzhi63/dirac)
- [Report Issues](https://github.com/dirac-lang/dirac-string/issues)
- [All Dirac Libraries](https://github.com/topics/dirac-library)
