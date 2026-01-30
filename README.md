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
<llm output="fileList">
  <system>ls -la</system>
  Analyze these files and create Dirac code to process them.
</llm>

<execute source="fileList"/>  <!-- LLM-generated code runs here -->
```


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

The LLM sees real system state, generates appropriate code, and that code executes—all in one flow.

## Key Features

### 1. **Seamless LLM Integration**
LLMs are first-class citizens, not afterthoughts:
```xml
<llm>What is 2+2?</llm>  <!-- Direct output -->
<llm output="result">Calculate 2+2</llm>  <!-- Store in variable -->
<llm execute="true">Write a loop</llm>  <!-- Generate and execute code -->
```

### 2. **Declarative Simplicity**
Express **what** you want, not **how** to do it:
```xml
<system>df -h</system>  <!-- Run shell command -->
<llm>Summarize the disk usage above</llm>
```

### 3. **Recursive Composition**
Programs can generate programs:
```xml
<subroutine name="analyze">
  <llm execute="true">
    Generate code to analyze <variable name="data"/>
  </llm>
</subroutine>
```

### 4. **Bra-Ket Notation** (Optional Compact Syntax)
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

### 5. **Library Ecosystem**
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
<llm output="analysis">
  <system>cat data.csv | head -20</system>
  What patterns do you see? Generate Dirac code to process the full file.
</llm>
<execute source="analysis"/>
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
<llm output="step1" execute="true">
  Task: Analyze logs in /var/log. Generate code for this step.
</llm>

<llm execute="true">
  Previous step output: <variable name="step1"/>
  Now generate code to summarize findings and email the report.
</llm>
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

---

*"In the quantum realm, a bra meets a ket to produce reality. In Dirac, a declaration meets an LLM to produce execution."*
