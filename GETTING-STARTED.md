# Getting Started with Dirac Shell

## Installation

```bash
npm install -g dirac-lang
```

## Quick Start

The `dish` command (Dirac Shell) works out of the box with minimal configuration!

### Option 1: Environment Variables (Quickest)

Simply set an API key environment variable:

```bash
# For Anthropic Claude
export ANTHROPIC_API_KEY="your-api-key-here"
dish

# For OpenAI GPT
export OPENAI_API_KEY="your-api-key-here"
dish
```

The shell will auto-detect your LLM provider and use sensible defaults:
- Anthropic → `claude-sonnet-4-20250514`
- OpenAI → `gpt-4o`

### Option 2: Global Configuration File

Create `~/.dirac/config.yml` for persistent settings:

```bash
mkdir -p ~/.dirac
cat > ~/.dirac/config.yml << EOF
llmProvider: anthropic
llmModel: claude-sonnet-4-20250514
# Optional: path to init script
initScript: shell-init.di
EOF
```

Still need to set the API key environment variable!

### Option 3: Project-Specific Configuration

Create `config.yml` in your project directory:

```yaml
llmProvider: anthropic
llmModel: claude-sonnet-4-20250514
initScript: shell-init.di

# Other optional settings:
libraryPaths:
  - /path/to/your/libraries
```

## Configuration Priority

Dirac looks for configuration in this order:

1. **Command-line flag**: `dish -f /path/to/config.yml`
2. **Current directory**: `./config.yml`
3. **User home**: `~/.dirac/config.yml`
4. **Environment variables**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.

## Init Scripts (Optional)

Create initialization scripts to run custom code when the shell starts.

### Global Init Script

Create `~/.dirac/shell-init.di`:

```xml
# Global Dirac Shell Init Script
# Define useful helper subroutines

<greet name=String |
  |output>Hello, |variable name=name>!

<status |
  |output>Dirac Shell is ready!
```

Reference it in `~/.dirac/config.yml`:

```yaml
initScript: shell-init.di
```

### Project Init Script

Create `shell-init.di` in your project directory and reference it in `./config.yml`.

## LLM Provider Configuration

### Supported Providers

- **anthropic** - Anthropic Claude models
- **openai** - OpenAI GPT models
- **custom** - Custom LLM server

### Environment Variables

- `ANTHROPIC_API_KEY` - Anthropic API key
- `OPENAI_API_KEY` - OpenAI API key
- `LLM_PROVIDER` - Override provider (if not auto-detected)
- `LLM_MODEL` - Override model name

### Custom LLM Server

```yaml
llmProvider: custom
customLLMUrl: http://localhost:5002
```

## Running Scripts

Execute Dirac scripts directly:

```bash
# XML notation (.di files)
dirac script.di

# Bra-ket notation (.bk files)
dirac script.bk
```

## Shell Commands

Once in the shell (`dish`), use these commands:

- `:help` - Show help
- `:exit` - Exit shell
- `:reload` - Reload configuration
- `:vars` - Show variables
- `:subroutines` - List subroutines
- `:save <name>` - Save subroutine to library
- `:load <name>` - Load subroutine from library

## Examples

### Minimal Setup (Just Environment Variable)

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
dish
> |output>Hello from Dirac!
Hello from Dirac!
> :exit
```

### With Global Config

```bash
# One-time setup
mkdir -p ~/.dirac
echo "llmProvider: anthropic" > ~/.dirac/config.yml
echo "llmModel: claude-sonnet-4-20250514" >> ~/.dirac/config.yml

# Then just run (with API key in environment)
export ANTHROPIC_API_KEY="sk-ant-..."
dish
```

### Running a Script

```bash
cat > hello.di << EOF
<root |
  |output>Hello from Dirac script!
EOF

dirac hello.di
```

## Next Steps

- Read the [README](README.md) for detailed documentation
- Check out example scripts in the `examples/` directory
- Join the community discussions
- Contribute to the project!

## Troubleshooting

### "No LLM provider configured"

Make sure you've set an API key:
```bash
export ANTHROPIC_API_KEY="your-key"
# or
export OPENAI_API_KEY="your-key"
```

### "Init script not found"

The init script is **optional**. If you see this warning, either:
- Create the referenced init script file
- Remove the `initScript` line from your config
- Ignore it (the shell will work fine without it)

### "Cannot find module"

Make sure you've installed the package globally:
```bash
npm install -g dirac-lang
```
