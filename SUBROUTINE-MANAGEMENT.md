# Subroutine Management in Dirac

## Overview

Dirac's knowledge base is composed of **subroutines** - reusable code units defined using bra-ket notation (`|tag>` for calls, `<subroutine>` for definitions). Unlike traditional programming languages where all code must be in one file or explicitly imported, Dirac uses a **distributed storage model** with **automatic discovery** through an indexing system.

## Core Concept: Distributed Knowledge Base

Think of Dirac's subroutines as a **library system** rather than a single codebase:

- **Definitions are scattered**: Subroutines can live in multiple `.di` files across different directories
- **Automatic indexing**: Dirac scans directories and builds an index of available subroutines
- **On-demand loading**: When you call `|my-subroutine>`, Dirac looks it up in the index and loads it
- **No explicit imports**: You don't need `import` or `require` statements - if it's indexed, you can use it

This is similar to how your brain retrieves knowledge - you don't load all your memories at once, but access them when needed.

## Storage Hierarchy

Dirac organizes subroutines in a hierarchical structure:

```
~/.dirac/lib/              # User's personal library
├── user/                  # User-created subroutines (canonical location)
│   ├── greeting.di
│   └── calculate.di
├── ai/                    # AI-generated subroutines
│   └── generated-2024-12-15.di
└── custom-package/        # Custom named directories

/path/to/project/dirac/lib/  # Project-specific library
├── utils.di
└── helpers.di

/path/to/dirac/lib/        # System library (built-in)
├── native-tags.di         # Core Dirac tags
└── stdlib.di              # Standard library
```

### Search Order (Priority)

When you call `|my-subroutine>`, Dirac searches in this order:

1. **Session memory** - Already loaded in current session (highest priority)
2. **User library** - `~/.dirac/lib/user/` (your custom code)
3. **Project library** - `./dirac/lib/` in current directory (project-specific)
4. **System library** - Built-in Dirac subroutines (lowest priority)

This allows you to **override** system subroutines with your own implementations.

## Indexing Mechanism

### How It Works

1. **Startup Indexing**: When Dirac starts, it scans configured directories for `.di` files
2. **Parse & Extract**: Each file is parsed to extract subroutine names and metadata
3. **Registry Building**: A registry maps `subroutine-name → file-path`
4. **Lazy Loading**: Subroutines aren't executed until called

### Index File Example

Internally, Dirac might build an index like:

```json
{
  "greeting": "/Users/you/.dirac/lib/user/greeting.di",
  "calculate-sum": "/Users/you/.dirac/lib/user/math.di",
  "open-browser": "/usr/local/lib/dirac/browser.di"
}
```

### Metadata Support

Subroutines can include metadata for better discovery:

```xml
<subroutine name="greeting" 
            param-name="string:required" 
            description="Greet a user by name"
            tags="util,hello,basic">
  <output>Hello, <variable name="name"/>!</output>
</subroutine>
```

This enables:
- **Search by description**: `search-subroutines query="greet user"`
- **Filter by tags**: Find all "util" subroutines
- **Parameter introspection**: What parameters does this take?

## Lifecycle Management

### 1. Creation

**In-session creation**:
```xml
|subroutine name=my-task>
  |output>Task executed
```
- Exists only in session memory
- Lost when session ends (unless saved)

**File-based creation**:
- Write `.di` file directly in `~/.dirac/lib/user/`
- Auto-indexed on next session startup

### 2. Discovery

**Available commands**:
- `:subs` - List all loaded subroutines in current session
- `|search-subroutines query="keyword">` - Search by description/tags
- `|index-subroutines>` - Re-scan directories and rebuild index

### 3. Modification

**Option A: Edit in session**:
```xml
|edit-subroutine name=my-task>
```
- Opens in `$EDITOR`
- Changes reflected immediately in session
- Mark as "modified" (not saved to disk yet)

**Option B: Edit file directly**:
- Modify the `.di` file in your editor
- Reload session or use `|index-subroutines>` to refresh

### 4. Persistence

**Save from session**:
```xml
|save-subroutine name=my-task>
```
- Default: Saves to `~/.dirac/lib/user/my-task.di`
- Custom path: `|save-subroutine name=my-task file=custom/path.di>`

**Auto-save on exit**:
- Shell mode detects unsaved/modified subroutines
- Prompts: "Save all and exit" or "Exit without saving"

### 5. Deletion

**Remove from session**:
- Use `:remove <subroutine-name>` in shell mode to remove from session stack
- Example: `:remove greet` removes all instances of `greet` from current session
- Note: This only removes from memory, not from disk

**Remove from disk**:
- Manually delete the `.di` file
- Run `|index-subroutines>` to refresh registry

### 6. Export as Training Data

**Save subroutine as training example**:
- Use `:save-subroutine-training <subroutine-name>` in shell mode
- You'll be prompted to provide a description (user request)
- Creates training data in JSONL format:
  ```json
  {"messages":[
    {"role":"user","content":"create a greeting subroutine"},
    {"role":"assistant","content":"<subroutine name=\"greet\">...</subroutine>"}
  ]}
  ```
- Opens in editor for review before saving
- Default save location: `~/.dirac/training/`

**Example workflow**:
1. Create/refine a subroutine in session
2. `:save-subroutine-training greet`
3. Enter description: "create a greeting subroutine that welcomes users by name"
4. Review in editor (opens automatically)
5. Save to file (e.g., `train.jsonl` or `/path/to/training/data.jsonl`)

**Use cases**:
- Building training datasets for fine-tuning LLMs
- Documenting subroutine creation patterns
- Creating examples for teaching Dirac syntax

## Configuration

### Configuring Index Paths

In `config.yml`:

```yaml
indexPaths:
  - ~/.dirac/lib
  - ./dirac/lib
  - /usr/local/lib/dirac
```

Dirac scans these directories recursively for `.di` files.

### Excluding Paths

```yaml
excludePaths:
  - ~/.dirac/lib/temp
  - ~/.dirac/lib/.backup
```

## Best Practices

### 1. Organize by Domain

```
~/.dirac/lib/
├── user/
│   ├── web/           # Web-related utilities
│   ├── data/          # Data processing
│   └── ai/            # AI/LLM helpers
```

### 2. Use Descriptive Metadata

```xml
<subroutine name="fetch-weather" 
            description="Get current weather for a city"
            tags="api,weather,data">
  <!-- implementation -->
</subroutine>
```

### 3. Namespace Conventions

Avoid name collisions with prefixes:

- `myproject-task` instead of `task`
- `web-scrape` instead of `scrape`

### 4. Version Control

Treat `~/.dirac/lib/user/` as a git repository:

```bash
cd ~/.dirac/lib/user
git init
git add .
git commit -m "My Dirac library"
```

### 5. Share Libraries

Dirac libraries are just directories of `.di` files:

```bash
# Share your library
tar -czf my-dirac-lib.tar.gz ~/.dirac/lib/user/

# Use someone else's library
cd ~/.dirac/lib/
tar -xzf someone-else-lib.tar.gz
```

## Advanced: Multi-File Subroutines

A single `.di` file can contain multiple subroutines:

```xml
<dirac>
  <subroutine name="add" param-a="number" param-b="number">
    <eval name="result">return parseInt(a) + parseInt(b);</eval>
    <output><variable name="result"/></output>
  </subroutine>
  
  <subroutine name="multiply" param-a="number" param-b="number">
    <eval name="result">return parseInt(a) * parseInt(b);</eval>
    <output><variable name="result"/></output>
  </subroutine>
</dirac>
```

Both `add` and `multiply` are indexed from `math.di`.

## Comparison to Traditional Systems

| Aspect | Traditional (Python/JS) | Dirac |
|--------|------------------------|-------|
| **Import** | `import module` required | Automatic via indexing |
| **Discovery** | IDE or docs | `search-subroutines`, `:subs` |
| **Scope** | File/module-based | Global (with override hierarchy) |
| **Storage** | Single project directory | Distributed across user/project/system |
| **Versioning** | Package managers (npm, pip) | File-based (git-friendly) |
| **Conflicts** | Explicit imports control | Search order priority |

## Future Directions

Potential enhancements to the management system:

1. **Namespaces**: `|web:scrape>` vs `|data:scrape>`
2. **Versioning**: `|greeting@v2>` for explicit version selection
3. **Package Manager**: `dirac install user/library-name`
4. **Remote Indexes**: Search and load from remote repositories
5. **Dependency Declaration**: Subroutines declare their dependencies

---

## Summary

Dirac's distributed knowledge base is like a **personal Wikipedia**:

- **Scattered storage**: Information lives in many files/directories
- **Automatic indexing**: Search engine finds what you need
- **On-demand loading**: Pages load only when you click them
- **User contributions**: You add pages (subroutines) to your library
- **No central authority**: Your library, your rules

This model makes Dirac **composable** (mix and match subroutines), **extensible** (add new ones anywhere), and **collaborative** (share libraries as files).
