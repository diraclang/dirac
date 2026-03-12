# LLM Dialog Context Management

## Overview

DIRAC's `<llm>` tag supports persistent dialog history, allowing the LLM to maintain conversation context across multiple calls. This enables:

1. **Reduced token usage**: Avoid repeating the full system prompt on every call
2. **Conversational flow**: LLM remembers previous exchanges
3. **Multi-turn interactions**: Build complex workflows with iterative refinement
4. **Multiple conversations**: Manage separate dialog threads with named contexts

## Attributes

### `save-dialog="true"`

Enables automatic dialog persistence using a default internal variable (`__llm_dialog__`).

**Use case**: Simple single-conversation scenarios

```xml
<llm save-dialog="true" execute="true">
  Create a greeting subroutine
</llm>

<llm save-dialog="true" execute="true">
  Now create a farewell subroutine
</llm>
```

### `context="variable_name"`

Stores dialog history in a named variable for explicit control.

**Use case**: Multiple simultaneous conversations, or when you need to inspect/manipulate the dialog history

```xml
<!-- Conversation A -->
<llm context="code_gen" execute="true">
  Create math functions
</llm>

<!-- Conversation B -->
<llm context="text_proc" execute="true">
  Create text utilities
</llm>

<!-- Continue A -->
<llm context="code_gen" execute="true">
  Add more math functions
</llm>
```

## How It Works

### First Call (No Context)

When no dialog history exists, the LLM receives:

1. **Full system prompt**:
   - Introduction to DIRAC language
   - Complete list of available subroutines
   - Detailed instructions for code generation

2. **User message**:
   - Your actual prompt

**Example prompt structure:**
```
System: Dirac is a XML based language...
        Available tags: <greet>, <output>, <loop>...
        IMPORTANT INSTRUCTIONS: 1. Output ONLY valid XML...

User: Create a greeting subroutine
```

### Subsequent Calls (With Context)

When dialog history exists (`save-dialog="true"` or `context` variable set), the LLM receives:

1. **Previous dialog history** (system + all user/assistant messages)
2. **Updated subroutine list** (prepended to current user message)
3. **Current user message**

**Example prompt structure:**
```
[Previous system prompt from first call]

User: Create a greeting subroutineAssistant: [Previous response with generated code]

User: Updated available Dirac XML tags:
      - greet : Say hello
      - farewell : Say goodbye
      - output : Display text
      ...
      
      User request: Now create a farewell subroutine
```

**Key benefits:**
- **Reduced tokens**: High-level DIRAC introduction sent only once
- **Context aware**: LLM remembers what it previously created
- **Always current**: Subroutine list updated with each call

## Dialog History Format

Dialog history is stored as an array of message objects:

```json
[
  {
    "role": "system",
    "content": "Dirac is a XML based language..."
  },
  {
    "role": "user",
    "content": "Create a greeting subroutine"
  },
  {
    "role": "assistant",
    "content": "<subroutine name=\"greet\">...</subroutine>"
  },
  {
    "role": "user",
    "content": "Updated available Dirac XML tags: ...\n\nUser request: Now create farewell"
  },
  {
    "role": "assistant",
    "content": "<subroutine name=\"farewell\">...</subroutine>"
  }
]
```

## Accessing Dialog History

### Reading the History

```xml
<!-- With named context -->
<llm context="my_conversation" output="result">
  Generate code
</llm>

<!-- Access the dialog history -->
<variable name="my_conversation" />
<!-- Outputs: [{"role":"system",...}, {"role":"user",...}, ...] -->
```

### Inspecting History Length

```xml
<eval>
  const history = session.variables.get('my_conversation');
  `Dialog has ${history.length} messages`;
</eval>
```

### Clearing History

```xml
<!-- Clear specific conversation -->
<assign name="my_conversation" value="[]" />

<!-- Or start fresh -->
<llm context="new_conversation" execute="true">
  Fresh start
</llm>
```

## Use Cases

### 1. Iterative Code Generation

Build complex functionality step-by-step:

```xml
<llm save-dialog="true" execute="true">
  Create a basic calculator with add and subtract
</llm>

<llm save-dialog="true" execute="true">
  Add multiply and divide functions
</llm>

<llm save-dialog="true" execute="true">
  Add error handling for divide by zero
</llm>
```

### 2. Conversational Debugging

Let the LLM help fix issues:

```xml
<llm context="debug" execute="true">
  Create a function to parse CSV data
</llm>

<!-- Test it -->
<parse-csv data="name,age\nAlice,30" />

<llm context="debug" execute="true">
  The output has extra spaces. Fix the parsing.
</llm>
```

### 3. Multiple Project Contexts

Manage different workstreams:

```xml
<!-- Frontend development -->
<llm context="frontend">Generate UI components</llm>

<!-- Backend development -->
<llm context="backend">Generate API endpoints</llm>

<!-- Database -->
<llm context="database">Generate schema migrations</llm>

<!-- Switch contexts freely -->
<llm context="frontend">Add validation to forms</llm>
<llm context="backend">Add authentication</llm>
```

### 4. Learning and Documentation

Create tutorial-style interactions:

```xml
<llm save-dialog="true" execute="true">
  Teach me DIRAC by creating a simple example
</llm>

<llm save-dialog="true" execute="true">
  Now show me how to use loops
</llm>

<llm save-dialog="true" execute="true">
  Combine the previous examples into one program
</llm>
```

## Best Practices

### 1. Use Named Contexts for Complex Workflows

```xml
<!-- Good: Clear separation -->
<llm context="user_auth" execute="true">...</llm>
<llm context="data_processing" execute="true">...</llm>

<!-- Avoid: Single default context for everything -->
<llm save-dialog="true">...</llm>  <!-- All mixed together -->
```

### 2. Periodically Update Subroutine List

When you define new subroutines outside of LLM calls, make a checkpoint call:

```xml
<!-- Define manual subroutines -->
<subroutine name="custom">...</subroutine>

<!-- Update LLM's knowledge -->
<llm context="project" execute="true">
  You now have access to "custom" subroutine. Use it to...
</llm>
```

### 3. Clear Context for Fresh Starts

```xml
<!-- Long conversation, getting off track -->
<llm save-dialog="true">...</llm>
<llm save-dialog="true">...</llm>  <!-- 10+ exchanges -->

<!-- Reset -->
<assign name="__llm_dialog__" value="[]" />
<llm save-dialog="true">Start fresh with new approach...</llm>
```

### 4. Combine with Validation

```xml
<llm 
  context="validated_gen" 
  execute="true"
  validate="true"
  autocorrect="true"
  max-retries="3"
>
  Generate code with automatic validation
</llm>
```

## Token Optimization

### Without Dialog Context

Every call sends ~2000 tokens:
- System prompt: ~1500 tokens
- User message: ~500 tokens
- **Total: ~2000 tokens × N calls**

### With Dialog Context

First call: ~2000 tokens (full prompt)
Subsequent calls: ~300 tokens (updated subroutines + user message)
- **Savings: ~85% on subsequent calls**

**Example (5 calls):**
- Without context: 5 × 2000 = 10,000 tokens
- With context: 2000 + 4 × 300 = 3,200 tokens
- **Savings: 68% overall**

## Limitations

1. **Context window**: Dialog history accumulates. Eventually you'll hit model limits (typically 128K-200K tokens).

2. **No automatic truncation**: Currently, you must manually clear history when it gets too long.

3. **Provider differences**: Dialog structure varies slightly between OpenAI, Anthropic, and Ollama.

4. **Session scope**: Dialog history is per-session. Doesn't persist across program restarts unless you save it to a file.

## Future Enhancements

- **Automatic summarization**: Compress old dialog when approaching token limits
- **Persistent storage**: Save dialog to disk, reload on restart
- **Smart pruning**: Keep only relevant messages, discard old exchanges
- **Vector search**: Retrieve relevant past exchanges instead of sending full history

## Examples

See:
- `examples/llm-dialog-persistence.di` - Basic save-dialog usage
- `examples/llm-named-context.di` - Multiple conversations with context variables

---

**Related Documentation:**
- [LLM Tag Reference](./README.md#llm-tag)
- [Context Loading](./CONTEXT-LOADING.md)
- [Validation and Feedback](./TODO.md)
