# Dirac: The Agentic Recursive Language for LLM-Augmented Computing

## What is Dirac?

Dirac is a **declarative execution language** specifically designed for the AI era, where large language models (LLMs) are not just tools, but active participants in code execution. It's named after physicist Paul Dirac and his bra-ket notation, reflecting its dual nature: bridging human-readable declarations with machine execution.

## The Recursive LLM Paradigm

Traditional programming languages separate code from AI. You write code, then separately call an LLM API. Dirac **eliminates this boundary**:

```xml
<llm execute="true">
  Create a Dirac program that lists all .txt files, 
  reads the first one, and summarizes it.
</llm>
```

The LLM doesn't just respond—it **generates Dirac code that immediately executes**. The generated code can itself call LLMs, creating a **recursive chain** where AI and execution seamlessly interweave.

## Agentic by Design

Dirac treats LLMs as **autonomous agents** that can:

- **Generate executable code** on-the-fly
- **Make decisions** based on runtime data
- **Invoke system commands** and process their output
- **Call themselves recursively** to break down complex tasks
- **Import and compose libraries** for modular problem-solving

Example of an agentic workflow:

```xml
<!-- LLM generates a subroutine and loads it onto the stack -->
<llm execute="true">
  <system>ls -la</system>
  Create a subroutine named "analyze-files" that processes these files.
</llm>

<!-- Immediately call the generated subroutine -->
<analyze-files />
```

The LLM sees real system state, generates a subroutine that's instantly available on the stack, and you can call it—all in one flow.

> **📘 Deep Dive**: For a comprehensive technical analysis of why Dirac's architecture naturally embodies agentic primitives—including its subroutine stack as a tool registry, hierarchical exception handling for planning, and boundary-based scoping—see **[AGENTIC-RUNTIME.md](AGENTIC-RUNTIME.md)**.

## Neural-Symbolic AI: Bridging Symbolic Reasoning and Neural Networks

Dirac is not just agentic—it’s also a natural fit for **neural-symbolic AI**. Its bra/ket-inspired knowledge representation allows you to express and connect symbolic logic and neural computation in a unified language.

**Example: Aristotle’s Syllogism**

- All humans are mortal.
- Socrates is a human.
- Therefore, Socrates is mortal.

In Dirac’s bra/ket notation, this can be represented as:
- `|mortal⟩⟨human|` (all humans are mortal)
- `|human⟩⟨Socrates|` (Socrates is a human)

When you ask `|Socrates⟩`, chaining these together yields `|mortal⟩`.

From a **neural network** perspective, these bra/ket pairs are like matrices (or tensors), and the input `|Socrates⟩` is a vector. The network applies transformations—possibly nonlinear—to produce an output.

From a **symbolic AI** perspective, these are like Dirac subroutines:
```xml
<subroutine name="human">
  <mortal/>
</subroutine>
```
Or, in Dirac’s shorthand:
```
<human|
  |mortal>
```

**Dirac bridges these worlds:**  
- As a symbolic language, it lets you define and chain logical relationships explicitly.
- As a bridge to neural networks, it enables LLMs and other neural models to participate in these chains, providing generative, nonlinear reasoning when needed.

Dirac is the missing link for building systems where **symbolic structure and neural intelligence work together**—making it ideal for the next generation of explainable, powerful AI.

## Key Features

### 1. **Interactive Agentic Shell (`dish`)**
A hybrid shell combining bash, Dirac, and natural language:
```bash
$ dish
> ls src
core/  stdlib/  cli/

> ? create a backup script for all my documents
[LLM generates and registers backup subroutine]

> |backup path=/Users/alice/Documents>
Backing up 342 files...
Done.
```

dish blends bash commands, braket notation (`|tag>`), and LLM intelligence into one seamless environment. The LLM remembers context, generates tools on demand, and you can use them immediately.

### 2. **Seamless LLM Integration**
LLMs are first-class citizens, not afterthoughts:
```xml
<llm>What is 2+2?</llm>  <!-- Direct output -->
<llm output="result">Calculate 2+2</llm>  <!-- Store in variable -->
<llm execute="true">Write a loop</llm>  <!-- Generate and execute code -->
```

### 3. **Declarative Simplicity**
Express **what** you want, not **how** to do it:
```xml
<llm>
  <system>df -h</system>
  Summarize the disk usage above
</llm>
```

### 4. **Recursive Composition**
Programs can generate programs:
```xml
<subroutine name="analyze">
  <llm execute="true">
    Generate code to analyze <variable name="data"/>
  </llm>
</subroutine>
```

### 5. **Bra-Ket Notation** (Optional Compact Syntax)
Inspired by quantum mechanics, our `.bk` format reduces verbosity:

**XML (.di):**
```xml
<subroutine name="greet">
  <parameters select="@name"/>
  <output>Hello, <variable name="name"/>!</output>
</subroutine>
<greet name="World"/>
```

**Bra-Ket (.bk):**
```
<greet|
  |parameters select=@name>
  |output>Hello, |variable name=name>!

|greet name=World>
```

### 6. **Library Ecosystem**
Import and compose functionality with namespace-safe prefixes:
```xml
<import src="dirac-http"/>
<HTTP_GET url="https://api.example.com"/>

<import src="dirac-database"/>
<DB_QUERY>SELECT * FROM users</DB_QUERY>
```

## Real-World Use Cases

### System Administration
```xml
<llm execute="true">
  <system>docker ps</system>
  Analyze these containers and create Dirac code to 
  restart any that are unhealthy.
</llm>
```

### Data Analysis
```xml
<llm execute="true">
  <system>cat data.csv | head -20</system>
  What patterns do you see? Generate a subroutine named "process-data" 
  to analyze the full file.
</llm>
<process-data />
```

### Task Automation
```xml
<llm execute="true">
  I need to backup all .js files modified today to ~/backup.
  Write Dirac code to do this.
</llm>
```

### Multi-Agent Workflows
```xml
<!-- First agent: analyze logs -->
<llm execute="true">
  Analyze logs in /var/log. Create a subroutine named "analyze-logs".
</llm>
<analyze-logs />

<!-- Second agent: summarize and report -->
<llm execute="true">
  Based on the log analysis above, create a subroutine named "email-report" 
  that summarizes findings and emails the report.
</llm>
<email-report />
```

## Why "Recursive" Matters

In traditional programming, recursion means a function calling itself. In Dirac, **the entire execution model is recursive**:

1. **Code generates code**: LLMs output Dirac programs
2. **Programs invoke LLMs**: Those programs can ask LLMs for more code
3. **Infinite depth**: This can continue to arbitrary depths (with safety limits)
4. **Context flows**: Each layer has access to results from previous layers

This creates a **self-extending** execution environment where the boundary between "prompt" and "program" dissolves.

## Installation

```bash
npm install -g dirac-lang
```

## Quick Start

**hello.di:**
```xml
<dirac>
  <output>Hello, World!</output>
</dirac>
```

**Run it:**
```bash
dirac hello.di
```

**With LLM (requires API key):**
```bash
export ANTHROPIC_API_KEY=your-key
echo '<dirac><llm>Write a haiku about code</llm></dirac>' | dirac -
```

## The Agentic Shell: `dish`

**dish** (Dirac Interactive Shell) is where Dirac truly shines as an agentic runtime. It's a **hybrid shell** that seamlessly blends three worlds:

1. **Bash compatibility**: Run regular shell commands (`ls`, `cd`, `grep`, etc.)
2. **Dirac execution**: Execute braket notation commands (`|output>`, `|greet name=X>`)
3. **Natural language**: Ask questions or give commands in plain English

When you type text without special syntax, dish first tries to execute it as a bash command. If no bash command matches, it sends the input to the LLM as a natural language request. To force LLM interpretation, start with `?` or `|ai>`.

```bash
dish
```

**In dish, you can:**

- **Run bash commands**: `ls -tl`, `cd src`, `cat file.txt` - all work as normal
- **Execute Dirac braket notation**: `|output>Hello!`, `|greet name=Alice>`, `|list-subroutines>`
- **Natural language queries**: Text input tries bash first, falls back to LLM if no command matches
- **Force LLM mode**: Start with `?` or `|ai>` to bypass bash and go straight to natural language
- **Get help**: Type `:help` to see available commands and usage examples
- **Maintain context**: The LLM remembers your conversation and previous actions
- **Call generated subroutines**: Functions created by the LLM are instantly available

**Example session:**
```
$ dish
Dirac Shell (dish) - Agentic Runtime

> :help
dish - Dirac Interactive Shell
Commands:
  :help              Show this help message
  :exit, :quit       Exit the shell
  bash commands      Run any bash command (ls, cd, grep, etc.)
  |tag-name>         Execute Dirac braket notation
  ? <prompt>         Force LLM interpretation
  |ai> <prompt>      Force LLM interpretation
  text               Try bash first, fallback to LLM if no match

> ls -tl
drwxr-xr-x  5 user  staff   160 Jul 29 10:30 src
-rw-r--r--  1 user  staff  1234 Jul 29 10:25 README.md

> ? create a subroutine that greets people by name
[LLM generates subroutine using braket notation]
Subroutine 'greet' registered.

> |greet name=Alice>
Hello, Alice!

> |list-subroutines>
- greet: Greets a person by name
- output: Outputs text
- system: Run shell commands
...
```

**Setup**: dish requires `config.yml` with your LLM provider credentials:

```yaml
# Dirac configuration
llmProvider: anthropic  # or openai, ollama, custom
llmModel: claude-sonnet-4-5-20250929

# For custom LLM server:
# llmProvider: custom
# customLLMUrl: http://localhost:5001

# Set API key in environment
# export ANTHROPIC_API_KEY=your-key
```

dish transforms Dirac from a language into a **conversational programming environment** where the boundary between code and natural language disappears.

## Philosophy

Dirac embraces three principles:

1. **LLMs are co-pilots, not tools**: They execute alongside your code, not as external services
2. **Declarative over imperative**: Say what you want, let AI figure out how
3. **Composable intelligence**: Small, reusable pieces combine into powerful workflows

## Future Vision

We're building toward a world where:
- **Natural language prompts** compile to executable Dirac
- **AI-generated libraries** extend functionality on-demand  
- **Self-improving programs** refactor themselves based on execution patterns
- **Multi-model orchestration** lets different LLMs collaborate on subtasks

## Community

- **GitHub**: [diraclang/dirac](https://github.com/diraclang/dirac)
- **npm**: [dirac-lang](https://www.npmjs.com/package/dirac-lang)
- **License**: MIT
- **Status**: Active development (v0.1.0)

## Join the Movement

Dirac is more than a language—it's a **paradigm shift** in how we think about code and AI. If you believe that:

- Programming should be more **declarative**
- LLMs should be **execution partners**, not API endpoints
- Code should **generate code** dynamically
- The future is **agentic** and **recursive**

...then Dirac is for you.

**Start building the future today.**

```bash
npm install -g dirac-lang
```

## Documentation

For detailed guides on using Dirac:

- **[Getting Started](GETTING-STARTED.md)** - Installation and first programs
- **[Dirac as an Agentic Runtime](AGENTIC-RUNTIME.md)** - Why Dirac is naturally suited for LLM agents
- **[Quick Start Library Guide](QUICKSTART-LIBRARY.md)** - Building reusable libraries
- **[LLM Integration](LLM-DIALOG-CONTEXT.md)** - Working with LLMs in Dirac
- **[Subroutine Management](SUBROUTINE-MANAGEMENT.md)** - Stack operations and subroutine control
- **[Training Data Export](TRAINING-DATA-EXPORT.md)** - Creating fine-tuning datasets
- **[Debugging](DEBUGGING.md)** - Debug mode and troubleshooting
- **[Exception Handling](EXCEPTION-HANDLING.md)** - Error handling and recovery
- **[Namespaces](NAMESPACES.md)** - Organizing code with namespaces
- **[Libraries](LIBRARIES.md)** - Using and creating libraries
- **[Conditional Tags](CONDITIONAL-TAGS.md)** - Control flow patterns

---

*"In the quantum realm, a bra meets a ket to produce reality. In Dirac, a declaration meets an LLM to produce execution."*

## PAUL: The Human-Friendly Dirac Dialect

Dirac's XML-based language is designed for robust machine execution and symbolic reasoning. For human authors, we introduce **PAUL** (Pattern Action Utility Language)—a concise, bra/ket-inspired notation for writing Dirac programs quickly and intuitively.

- PAUL uses bra/ket syntax and positional arguments for readability.
- It is ideal for human editing, rapid prototyping, and LLM prompts.
- PAUL scripts are typically saved with the `.bk` extension.
- The Dirac interpreter translates PAUL to XML Dirac for execution.

**Example:**

PAUL (.bk):
```
|greet Alice>
```

Dirac XML (.di):
```xml
<greet name="Alice" />
```

**Note:**
- PAUL relies on conventions for mapping positional arguments to named parameters.
- For machine execution, always convert PAUL to XML Dirac.
- The `.bk` extension is recommended for PAUL scripts.

PAUL is the human-centric dialect of Dirac—optimized for clarity, speed, and LLM interaction.
