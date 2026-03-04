# Dirac Shell

Interactive REPL for Dirac with bra-ket notation support.

## Installation

```bash
cd dirac
npm install
npm run build
```

## Usage

Start the shell:

```bash
dirac shell
```

Or with a config file:

```bash
dirac shell --config ./config.yml
```

Or with environment variables:

```bash
export LLM_PROVIDER=custom
export CUSTOM_LLM_URL=http://localhost:5001
dirac shell
```

## Shell Commands

Inside the shell, you can use these commands:

- `:help` - Show help
- `:vars` - List all variables
- `:subs` - List all subroutines  
- `:clear` - Clear session
- `:debug` - Toggle debug mode
- `:config` - Show configuration
- `:exit` - Exit shell

## Bra-Ket Syntax

### Ket Notation (|tag>)

Single line:
```
> |output>Hello World
Hello World

> |defvar name=count value=5>
> |variable name=count>
5
```

Multi-line (press Enter on empty line to execute):
```
> |llm>
... create a greeting subroutine
... that takes a name parameter
... 
[Executes]
```

### Bra Notation (<tag|)

For subroutine definitions (multi-line):
```
> <greeting| name=String
... (Press Enter on empty line to execute, or Ctrl+C to cancel)
...   |output>Hello |variable name=name>
... 
✓ Subroutine 'greeting' defined

> |greeting name=World>
Hello World
```

**Important Notes on Multi-line Input:**
- The shell **automatically adds indentation** if you don't provide it
- It shows how many spaces are expected: `(Indent with 2 spaces, or press Enter...)`
- You can either:
  - Type the spaces yourself (e.g., 2 spaces before your line)
  - Just type the content - shell will add the spaces for you
- Press **Enter on empty line** to execute the block
- Press **Ctrl+C** to cancel multi-line input

**How it works:**
- When you type `<greeting|` or `|llm>`, the shell expects indented content
- Next line: if you don't start with spaces, shell adds them automatically
- This ensures the bra-ket parser receives properly indented input

## LLM Integration

With LLM configured (anthropic, openai, ollama, or custom):

```
> |llm execute=true>
... create a subroutine called 'add'
... that takes two numbers x and y
... and outputs their sum
...
[LLM generates Dirac code and executes it]
✓ Created subroutine: add

> |add x=5 y=3>
8
```

## Session Persistence

The shell maintains state across inputs:
- All variables remain in scope
- All subroutines remain available
- LLM context is preserved (if using custom provider with context)

## History

Command history is saved to `~/.dirac_history` and persists across sessions.
Use arrow keys to navigate history.

## Example Session

```
$ dirac shell
Dirac Shell v0.1.0
Type :help for commands, :exit to quit

LLM: custom (http://localhost:5001)

> |defvar name=greeting value="Hello">
> |output>|variable name=greeting>, World!
Hello, World!

> <welcome| name=String
... (Press Enter on empty line to execute, or Ctrl+C to cancel)
...   |output>Welcome, |variable name=name>!
... [Press Enter here on empty line]

✓ Subroutine 'welcome' defined

> |welcome name=Alice>
Welcome, Alice!

> :vars
Variables:
  greeting = "Hello"

> :subs
Subroutines:
  welcome(name)

> |llm execute=true>
... (Press Enter on empty line to execute, or Ctrl+C to cancel)
... create a farewell subroutine
... [Press Enter here]

[LLM generates code]
✓ Created subroutine: farewell

> |farewell name=Bob>
Goodbye, Bob!

> :exit
Goodbye!
```

**Key Points:**
- For single-line commands, just type and press Enter
- For multi-line (like `<welcome|` or `|llm>`), the shell prompts with `...`
- Shell auto-adds indentation if you don't provide it yourself
- Press Enter on an empty line to execute the accumulated block

## Tips

1. **Multi-line input**: 
   - The shell detects when you need continuation (bra syntax like `<greeting|`, or ket without content like `|llm>`)
   - It shows expected indent level in the hint
   - **Auto-indent**: Just type content without spaces - shell adds them!
   - **Manual indent**: Or add spaces yourself for more control
   - Press **Enter on empty line** to execute the block

2. **Indentation flexibility**: 
   ```
   > |llm>
   ... (Indent with 2 spaces, or press Enter on empty line to execute)
   ... create greeting     ← No leading spaces typed
   ```
   Shell automatically converts this to:
   ```
   |llm>
     create greeting       ← 2 spaces added by shell
   ```

3. **Cancel input**: Press Ctrl+C to cancel multi-line input, Ctrl+C again to exit.

3. **Debug mode**: Enable with `:debug` to see generated XML and execution details.

4. **Config file**: Place `config.yml` in your working directory, or specify with `--config`.

5. **LLM execute mode**: Use `|llm execute=true>` to have the LLM generate and immediately execute Dirac code.
