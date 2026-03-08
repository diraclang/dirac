# Context Loading for LLM

## Overview

The context loading system allows Dirac to intelligently discover and import relevant subroutines based on natural language queries. This enables RAG-style (Retrieval-Augmented Generation) LLM interactions where the LLM has access to relevant tools/subroutines without manually managing imports.

## Architecture

```
User Query → Search Registry → Import Files → LLM with Context → Execute Code
```

## Components

### 1. Subroutine Registry (`src/runtime/subroutine-registry.ts`)

Maintains an index of all subroutines with their metadata:
- Name, description, parameters
- File path for importing
- Source code (optional)

**Storage**: `~/.dirac/subroutine-index.json`

### 2. Tags

#### `<index-subroutines>`
Scans directories for `.di` files and indexes all subroutines.

```xml
<index-subroutines path="../dirac-stdlib" />
<index-subroutines path="." />
```

#### `<search-subroutines>`
Search indexed subroutines (currently text-based, vector search planned).

```xml
<search-subroutines query="string manipulation" limit="5" format="text" />
<search-subroutines query="background color" output="results" format="json" />
```

**Formats**: `text`, `json`, `xml`, `braket`

#### `<load-context>`
Search and automatically import relevant subroutines.

```xml
<load-context query="set background color to blue" limit="5" />
<load-context query="string operations" import="true" />
```

**Attributes**:
- `query` (required): Natural language query
- `limit` (optional, default 5): Max results
- `import` (optional, default true): Auto-import files
- `output` (optional): Store summary in variable

#### `<registry-stats>`
Show registry statistics.

```xml
<registry-stats />
```

### 3. Shell Commands

- `:index <path>` - Index a directory
- `:search <query>` - Search subroutines
- `:load <query>` - Load context (search + import)
- `:stats` - Show statistics

## Usage Patterns

### Pattern 1: Manual Context Loading

```xml
<!-- Index libraries -->
<index-subroutines path="../dirac-stdlib" />

<!-- Load relevant subroutines -->
<load-context query="I need to manipulate strings and format output" />

<!-- Now LLM has access to imported subroutines -->
<llm noextra="true" execute="true">
  Convert "hello world" to uppercase and show it
</llm>
```

### Pattern 2: Shell Interactive

```bash
$ dirac shell
> :index ../dirac-stdlib
Indexed 27 subroutines from 6 files

> :search string
Found 3 subroutine(s):
  SUBSTRING(str, start, length)
  CONCAT(str1, str2)
  UPPERCASE(text)

> :load string manipulation
[load-context] Found 3 relevant subroutines
[load-context] Imported: ../dirac-stdlib/lib/string.di

> |uppercase text="hello">
HELLO
```

### Pattern 3: Future - Auto-Loading LLM

```xml
<!-- Proposed enhancement -->
<llm execute="true" autoload="true" autoload-limit="5">
  Make the background blue and play a sound
</llm>
```

This would:
1. Extract intent from prompt
2. Call `<load-context>` internally
3. Import relevant subroutines
4. Add them to LLM system prompt
5. Execute generated code

## Current Search Algorithm

**Text-based scoring** (placeholder for vector embeddings):
- Exact name match: +100
- Partial name match: +50
- Description contains query: +30
- Parameter name contains query: +10

**Limitations**:
- No semantic understanding ("add" won't find "sum")
- Case-insensitive substring matching only
- No typo tolerance

## Planned Enhancement: Vector Embeddings

### Why Vector Search?

Current: Query "addition" won't find subroutine named "ADD"  
With vectors: Semantically similar terms are matched

### Implementation Plan

1. **Generate embeddings** for each subroutine:
   ```javascript
   embedding = embed(name + " " + description + " " + params)
   ```

2. **Store in vector database** (lancedb recommended):
   ```javascript
   db.createTable('subroutines', {
     name: 'ADD',
     embedding: [0.2, 0.8, 0.1, ...],
     metadata: {...}
   })
   ```

3. **Semantic search**:
   ```javascript
   queryEmbedding = embed(userQuery)
   results = db.search(queryEmbedding).limit(5)
   ```

4. **Auto-import matches**:
   ```javascript
   for (result of results) {
     import(result.filePath)
   }
   ```

### Embedding Options

- **Ollama**: `nomic-embed-text` (local, free)
- **OpenAI**: `text-embedding-ada-002` (cloud, paid)
- **Custom**: MLX-based local model

## Design Philosophy

> "Using a consistent embedding vector to represent a <bra is more consistent with my philosophical point... when user proposes a prompt, it will do a context-based search in the existing subroutines, and import them into the dirac as background context, then do a call to llm. The llm will be prompted with the background context. So that mechanism is very similar to RAG."
> 
> — User's vision for Dirac context system

## Benefits

1. **No manual imports**: User doesn't need to know which library has the function
2. **Semantic discovery**: Natural language queries find relevant tools
3. **LLM context injection**: Automatically provide relevant subroutines to LLM
4. **Scalability**: Works with large libraries (1000s of subroutines)
5. **Evolution**: Library grows, discovery improves automatically

## Examples

See:
- `test-registry.di` - Basic registry functionality
- `test-load-context.di` - Context loading demo
- `examples/llm-with-context.di` - LLM integration example

## Future Work

- [ ] Vector embedding generation
- [ ] LanceDB integration
- [ ] Semantic similarity search
- [ ] Auto-load attribute for `<llm>` tag
- [ ] Caching and incremental updates
- [ ] Relevance scoring tuning
- [ ] Multi-language support
