# Training Data Export

## Overview

Dirac provides tools to export LLM dialogs and subroutines as training data in JSONL format, suitable for fine-tuning language models.

## Commands

### `:save-training` - Export LLM Dialog

Saves the complete LLM conversation history from `__llm_dialog__` variable.

**Usage:**
```bash
:save-training [mode=full|pruned|both]
```

**Modes:**
- `full` - Complete dialog including corrections and errors
- `pruned` - Removes error/correction cycles (cleaner training data)
- `both` - Saves two versions for comparison

**Example:**
```bash
# After having an LLM conversation in a Dirac script
:save-training mode=pruned
# Opens in editor, then prompts for save location
```

**Output format:**
```json
{"messages":[
  {"role":"system","content":"system prompt..."},
  {"role":"user","content":"user request..."},
  {"role":"assistant","content":"assistant response..."}
]}
```

### `:save-subroutine-training` - Export Subroutine

Saves a specific subroutine as a training example with user description.

**Usage:**
```bash
:save-subroutine-training <subroutine-name>
```

**Workflow:**
1. Command prompts for description (what user would ask to create this)
2. Serializes subroutine to XML format
3. Creates training example with user/assistant messages
4. Opens in editor for review
5. Prompts for save location

**Example:**
```bash
# First, create a subroutine in your session
|subroutine name=greet>
  |output>Hello, |variable name=name>!

# Then export it as training data
:save-subroutine-training greet
# Prompt: Enter description: "create a greeting subroutine that says hello"
# Opens in editor, then save to file
```

**Output format:**
```json
{"messages":[
  {"role":"user","content":"create a greeting subroutine that says hello"},
  {"role":"assistant","content":"<subroutine name=\"greet\">\n  <output>Hello, <variable name=\"name\" />!</output>\n</subroutine>"}
]}
```

## Saving Training Data

### Default Save Location

If you provide just a filename (no path), data is saved to:
```
~/.dirac/training/filename.jsonl
```

### Custom Paths

You can specify:
- **Absolute path**: `/path/to/training/data.jsonl`
- **Home path**: `~/my-training/data.jsonl`
- **Relative path**: `./training/data.jsonl`
- **Just filename**: `my-data.jsonl` (saves to `~/.dirac/training/`)

### JSONL Format

Training data is appended to files in JSONL (JSON Lines) format - one JSON object per line:

```jsonl
{"messages":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}
{"messages":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}
{"messages":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}
```

This format is standard for training datasets and supported by most fine-tuning tools.

## Use Cases

### 1. LLM Fine-Tuning

Build datasets of Dirac code generation examples to fine-tune models for better Dirac code generation:

```bash
# Collect multiple subroutines
:save-subroutine-training greeting
:save-subroutine-training calculate-bmi
:save-subroutine-training fetch-data
# All append to the same file
```

### 2. Pattern Documentation

Create a library of common patterns with their descriptions:

```bash
:save-subroutine-training error-handler
# Description: "create error handling with try-catch"
```

### 3. Teaching Materials

Build training sets for teaching Dirac syntax:

```bash
:save-subroutine-training hello-world
# Description: "create a simple hello world program"
```

### 4. Quality Control

Use pruned mode to create clean training data without errors:

```bash
:save-training mode=pruned
# Removes correction cycles, leaving only successful interactions
```

## Best Practices

### 1. Clear Descriptions

When exporting subroutines, write descriptions as natural user requests:

**Good:**
- "create a greeting subroutine that welcomes users by name"
- "write a function to calculate BMI from weight and height"
- "make a subroutine to list files in a directory"

**Avoid:**
- "greet subroutine" (too vague)
- "function that does stuff" (not specific)
- Technical jargon without context

### 2. Review Before Saving

Always review the training example in the editor:
- Check the description is clear
- Verify the subroutine code is correct
- Remove any sensitive information
- Format for readability

### 3. Organize Training Files

Create separate files for different categories:

```
~/.dirac/training/
├── basic-syntax.jsonl        # Simple examples
├── web-scraping.jsonl        # Web-related tasks
├── data-processing.jsonl     # Data manipulation
└── llm-interaction.jsonl     # LLM dialog examples
```

### 4. Prune Errors

When saving LLM dialogs, use `mode=pruned` to remove error/correction cycles:

```bash
:save-training mode=both
# Compare full vs pruned to decide which is better for your use case
```

## Integration with Training Tools

### MLX (Apple Silicon)

```bash
# Export training data from Dirac
:save-subroutine-training my-task

# Use with mlx-lm for fine-tuning
cd ~/mlx-lm
python -m mlx_lm.lora --data ~/.dirac/training/train.jsonl
```

### OpenAI Fine-Tuning

```bash
# Export multiple examples
:save-subroutine-training task1
:save-subroutine-training task2
# ... more examples

# Upload to OpenAI
openai api fine_tunes.create \
  -t ~/.dirac/training/train.jsonl \
  -m gpt-3.5-turbo
```

### Hugging Face

```bash
# Export Dirac examples
:save-subroutine-training example

# Use with transformers
from datasets import load_dataset
dataset = load_dataset('json', data_files='~/.dirac/training/train.jsonl')
```

## Example Workflow

### Complete Training Data Pipeline

1. **Create high-quality subroutines**:
```xml
|subroutine name=weather-fetch>
  |eval name=data>
    const response = await fetch(`https://api.weather.com/${city}`);
    return await response.json();
  </eval>
  |output>Weather: ${data}
```

2. **Export with description**:
```bash
:save-subroutine-training weather-fetch
# Description: "create a subroutine to fetch weather data for a city using an API"
```

3. **Review in editor** (opens automatically)

4. **Save to organized location**:
```
Save to file: ~/training/api-examples.jsonl
```

5. **Repeat for similar tasks** to build a comprehensive dataset

6. **Use for fine-tuning** your preferred model

## Troubleshooting

### Subroutine Not Found

```bash
:save-subroutine-training my-task
# Error: Subroutine 'my-task' not found in session
```

**Solution:** Use `:subs` to list available subroutines, or define the subroutine first.

### Editor Not Opening

```bash
# Set your preferred editor
export EDITOR=vim
# or
export EDITOR=code
# or
export EDITOR=nano
```

### Malformed JSONL

If training file is corrupted:
```bash
# Validate JSONL format
cat ~/.dirac/training/train.jsonl | jq .
# Each line should parse as valid JSON
```

## Related Documentation

- [SUBROUTINE-MANAGEMENT.md](./SUBROUTINE-MANAGEMENT.md) - Complete subroutine lifecycle
- [LLM-DIALOG-CONTEXT.md](./LLM-DIALOG-CONTEXT.md) - LLM integration details
- [GETTING-STARTED.md](./GETTING-STARTED.md) - Basic Dirac usage
