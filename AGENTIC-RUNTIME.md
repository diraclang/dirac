# Dirac: A Natural Agentic Runtime for Large Language Models

## Abstract

While Dirac appears to be an XML-based declarative programming language, its interpreter architecture naturally embodies the core primitives required for LLM-driven agentic systems. This paper argues that Dirac's design—featuring scoped subroutine stacks, hierarchical exception handling, and boundary-based scoping—provides an ideal runtime environment for autonomous agent execution, hierarchical planning, and dynamic replanning without requiring additional orchestration layers.

## Introduction

Modern LLM-based agents require sophisticated runtime environments to manage:
1. Dynamic tool discovery and registration
2. Hierarchical task decomposition
3. Failure recovery and replanning
4. Context scoping and state management
5. Structured output capture

Most agentic frameworks build these capabilities as external orchestration layers atop existing languages. Dirac, however, embodies these primitives natively in its interpreter design, making it a natural fit for agentic workloads.

## 1. Subroutine Stack as Tool Registry

### The Problem
LLM agents need access to a registry of available tools (functions/actions) that can be invoked. This registry must be:
- **Dynamic**: Tools available should depend on current context
- **Scoped**: Different execution contexts may have different tools available
- **Discoverable**: The agent must be able to query what tools are available

### Dirac's Solution
Dirac's subroutine stack naturally serves as a scoped tool registry:

```xml
<!-- Global tool definitions -->
<subroutine name="book-flight">
  <!-- Flight booking implementation -->
</subroutine>

<subroutine name="book-hotel">
  <!-- Hotel booking implementation -->
</subroutine>

<!-- Task-specific context with additional tools -->
<subroutine name="plan-trip">
  <!-- Local tools only available within this scope -->
  <subroutine name="calculate-travel-time">
    <!-- Local helper -->
  </subroutine>
  
  <!-- Agent can discover: book-flight, book-hotel, calculate-travel-time -->
  <llm model="gpt-4">
    Available tools: ${session.subroutines}
    Task: Plan a trip to Paris
  </llm>
</subroutine>
```

**Key Benefits:**
- **Automatic scoping**: Inner subroutines inherit outer tools via lexical scoping
- **Boundary management**: The `subBoundary` mechanism naturally limits tool visibility to relevant context
- **No external registry**: Tool discovery is intrinsic to the language runtime
- **Natural composition**: Tools can define sub-tools, creating hierarchical tool organizations

## 2. Exception Handling for Hierarchical Planning

### The Problem
Agentic systems must handle partial failures gracefully:
- A high-level plan may fail at specific sub-steps
- Recovery should be localized—only replan the failed portion
- The system should propagate failure upward only when local recovery is impossible

### Dirac's Solution
Dirac's exception mechanism provides natural hierarchical error handling:

```xml
<subroutine name="task-list">
  <try>
    <go-to-airport />
    <fly-to-paris />
    <airport-to-hotel />
  <catch name="transportation_failed">
    <!-- Replan entire trip -->
    <llm>Original plan failed. Create alternative approach.</llm>
  </catch>
  </try>
</subroutine>

<subroutine name="go-to-airport">
  <try>
    <take-uber />
    <walk-to-security />
  <catch name="uber_unavailable">
    <!-- Local replanning - only this subtask -->
    <take-public-transit />
    <walk-to-security />
  </catch>
  </try>
</subroutine>

<subroutine name="take-uber">
  <!-- Inside take-uber, LLM checks availability -->
  <llm model="gpt-4" execute="true">
    Check if Uber is available at current location.
    If not available, respond with: <throw name="uber_unavailable" />
  </llm>
  <!-- If no exception thrown, proceed with booking -->
  <book-uber />
</subroutine>
```

**How it works:**
1. LLM generates `<throw name="uber_unavailable" />` when it detects failure
2. The `<throw>` tag executes and breaks out of the current `<try>` block
3. Control transfers to the matching `<catch name="uber_unavailable">` block
4. The catch block performs local replanning (uses public transit instead)

**Key Benefits:**
- **Localized recovery**: Exceptions caught at the appropriate level of abstraction
- **Agent control**: LLM can throw exceptions to signal failures using `<throw>` tag
- **Natural replanning**: Catch blocks can invoke LLM for alternative strategies
- **Hierarchical propagation**: Unhandled exceptions bubble up to parent contexts

## 3. Boundary-Based Scoping System

### The Problem
Agentic systems need to manage multiple types of scope:
- **Variable scope**: Local vs. global state
- **Tool scope**: What actions are available
- **Output scope**: Capturing results of subtasks

### Dirac's Solution
Dirac implements a unified boundary system for all scoping needs:

```xml
<defvar name="trip-plan">
  <!-- Output boundary set automatically -->
  <llm model="gpt-4">
    Plan a 3-day trip to Paris
  </llm>
  <!-- Output from LLM captured in variable -->
</defvar>

<subroutine name="execute-plan">
  <!-- Subroutine boundary limits tool visibility -->
  <defvar name="day1-result">
    <!-- Variable boundary for lexical scoping -->
    <!-- Output boundary captures nested output -->
    <execute-day-one />
  </defvar>
</subroutine>
```

**Boundary Types:**
1. **`varBoundary`**: Marks where to start searching for variables (lexical scoping)
2. **`subBoundary`**: Marks where to start searching for subroutines (tool discovery)
3. **`outputBoundary`**: Marks where to capture output for assignment or inspection

**Key Benefits:**
- **Unified mechanism**: Same boundary pattern for variables, tools, and output
- **Automatic capture**: Child task output automatically captured by parent context
- **Scope introspection**: `<session-log boundary="true" />` can inspect current scope
- **Clean isolation**: Subtasks cannot pollute parent state

## 4. Declarative Syntax for LLM Generation

### The Problem
Agents need to generate executable code. The target language should be:
- **Unambiguous**: Clear structure reduces hallucination
- **Validatable**: Easy to verify correctness before execution
- **Readable**: Both humans and LLMs can understand it
- **Structured**: Natural hierarchy matches planning decomposition

### Dirac's Solution
XML-based syntax provides structured, validatable agent output:

```xml
<!-- LLM can reliably generate well-formed plans -->
<llm model="gpt-4" result="generated-plan">
  Generate a Dirac program to book a trip to Paris.
  Available tags: subroutine, llm, call, defvar, try, catch
</llm>

<!-- Validate before execution -->
<eval code="validateDiracXML(session.variables.generated_plan)" />

<!-- Execute agent-generated code -->
<eval code="executeGeneratedPlan(session.variables.generated_plan)" />
```

**Key Benefits:**
- **Self-closing vs. paired tags**: Clear structure (`<go-to-airport />` vs. `<try>...</try>`)
- **Attribute validation**: Type-safe parameters (e.g., `result="varname"`)
- **XML tooling**: Standard parsers catch malformed output
- **Natural hierarchy**: Nesting directly represents task decomposition

## 5. Session State Management

### The Problem
Agents need persistent state across:
- Multiple LLM calls
- Nested subroutine invocations
- Error recovery and replanning

### Dirac's Solution
The `DiracSession` object provides centralized state:

```typescript
interface DiracSession {
  variables: Array<{name: string, value: any, boundary: number}>;
  subroutines: Array<{name: string, element: Element, boundary: number}>;
  output: string[];
  varBoundary: number;
  subBoundary: number;
  outputBoundary: number;
  parameterStack: any[];
  // ... exception handling state
}
```

**Agent Usage:**
```xml
<!-- State persists across agent interactions -->
<defvar name="conversation-history">[]</defvar>

<llm model="gpt-4" result="response1">
  User: Book a flight to Paris
  History: <variable name="conversation-history" />
</llm>

<!-- Update state -->
<eval code="session.variables.conversation_history.push(response1)" />

<llm model="gpt-4" result="response2">
  User: Change that to London instead
  History: <variable name="conversation-history" />
</llm>
```

**Key Benefits:**
- **Centralized state**: All context in one object
- **Boundary tracking**: State scoping managed automatically
- **Serializable**: Session can be saved/restored for long-running agents
- **Type-safe**: TypeScript interface ensures consistency

## 6. Built-in LLM Integration

### The Problem
Agentic runtimes need seamless LLM invocation with:
- Prompt construction with session context
- Response capture and parsing
- Error handling for API failures
- Support for different models/providers

### Dirac's Solution
Native `<llm>` tag with session-aware context:

```xml
<llm 
  model="gpt-4" 
  result="next-action"
  system="You are a travel planning assistant"
  max-tokens="1000">
  
  Available tools:
  <subroutine-list />
  
  Current state:
  - Location: <variable name="current-location" />
  - Budget: <variable name="budget" />
  
  What should I do next?
</llm>

<!-- Response automatically stored in variable -->
<output>Agent decided: <variable name="next-action" /></output>
```

**Key Benefits:**
- **Context injection**: Session variables and subroutines available in prompts
- **Result capture**: Response stored directly in session variables
- **Error handling**: API failures can be caught with `<try>/<catch>`
- **Model flexibility**: Support for multiple providers (OpenAI, Anthropic, etc.)

## 7. Natural Fit for Hierarchical Planning

### The Complete Picture
Combining all these features, Dirac naturally supports hierarchical agentic workflows:

```xml
<subroutine name="travel-agent">
  <!-- Level 1: High-level planning -->
  <llm model="gpt-4" result="high-level-plan">
    Create a high-level plan to travel to Paris for 3 days.
    Available tools: <subroutine-list />
  </llm>
  
  <!-- Level 2: Execute each phase with exception handling -->
  <try>
    <subroutine name="phase1-transportation">
      <llm model="gpt-4" result="transport-plan">
        Plan transportation to Paris. Budget: <variable name="budget" />
        Available tools: <subroutine-list />
      </llm>
      
      <!-- Level 3: Execute specific actions -->
      <try>
        <call name="book-flight" />
      <catch name="flight_unavailable">
        <!-- Level 4: Local replanning -->
        <llm model="gpt-4" result="alternative">
          Flight unavailable. Generate alternative.
        </llm>
        <call name="book-train" />
      </catch>
      </try>
    </subroutine>
    
    <subroutine name="phase2-accommodation">
      <!-- Similar hierarchical planning -->
    </subroutine>
    
  <catch name="critical_failure">
    <!-- Top-level recovery -->
    <llm model="gpt-4">
      Critical failure in travel planning. Create entirely new approach.
    </llm>
  </catch>
  </try>
</subroutine>
```

**This example demonstrates:**
1. **Multi-level planning**: LLM at each abstraction level
2. **Scoped tool discovery**: Each level sees appropriate tools
3. **Localized error recovery**: Failures handled at proper level
4. **State management**: Budget and other context flow through hierarchy
5. **Output capture**: Each phase's results available to subsequent phases

## 8. Comparison with Traditional Agentic Frameworks

### LangChain
**LangChain approach:**
```python
from langchain.agents import initialize_agent, Tool

tools = [
    Tool(name="book_flight", func=book_flight),
    Tool(name="book_hotel", func=book_hotel),
]

agent = initialize_agent(tools, llm, agent="structured-chat")
result = agent.run("Plan a trip to Paris")
```

**Limitations:**
- Tool registry is flat, no scoping
- Error handling via Python exceptions (not agent-controlled)
- No native hierarchy - must build orchestration manually
- State management separate from execution

**Dirac approach:**
```xml
<subroutine name="book-flight">...</subroutine>
<subroutine name="book-hotel">...</subroutine>

<llm model="gpt-4">Plan a trip to Paris</llm>
```

**Advantages:**
- Tools automatically scoped and discoverable
- Agent can throw exceptions via XML tags
- Natural hierarchy via nested subroutines
- State integrated into execution model

### AutoGPT / BabyAGI
**AutoGPT approach:**
- Task queue managed externally
- Memory stored in vector database
- Tools registered via decorators

**Dirac advantages:**
- Task queue naturally represented as subroutine calls
- State management via session boundaries
- Tools registered via subroutine in scope
- Execution model *is* the agentic model

## 9. Additional Runtime Features

### Python Integration
Execute external code while maintaining session state:

```xml
<python result="processed-data">
import pandas as pd
# Session variables available as globals
data = pd.DataFrame(raw_data)
result = data.describe().to_dict()
</python>
```

### Remote Execution
Distributed agent execution:

```xml
<remote server="paris-agent-server">
  <book-local-tour />
</remote>
```

### Conditional Execution
Agent can make conditional decisions declaratively:

```xml
<condition>
  <if test="budget > 1000">
    <book-luxury-hotel />
  </if>
  <else>
    <book-budget-hotel />
  </else>
</condition>
```

## 10. Real-World Example: Multi-Agent Travel Planning

```xml
<subroutine name="travel-planning-system">
  
  <!-- Flight agent with specialized tools -->
  <subroutine name="flight-agent">
    <subroutine name="search-flights">...</subroutine>
    <subroutine name="compare-prices">...</subroutine>
    <subroutine name="book-flight">...</subroutine>
    
    <llm model="gpt-4" result="flight-plan">
      Role: You are a flight booking specialist.
      Available tools: <subroutine-list />
      Task: Find best flight to <variable name="destination" />
    </llm>
  </subroutine>
  
  <!-- Hotel agent with different specialized tools -->
  <subroutine name="hotel-agent">
    <subroutine name="search-hotels">...</subroutine>
    <subroutine name="check-reviews">...</subroutine>
    <subroutine name="book-hotel">...</subroutine>
    
    <llm model="gpt-4" result="hotel-plan">
      Role: You are a hotel booking specialist.
      Available tools: <subroutine-list />
      Task: Find hotel near <variable name="destination" />
    </llm>
  </subroutine>
  
  <!-- Coordinator agent orchestrates specialists -->
  <subroutine name="coordinator-agent">
    <llm model="gpt-4" result="coordination-plan">
      You are a travel coordinator. You can delegate to:
      - flight-agent: For flight bookings
      - hotel-agent: For accommodation
      
      User request: <variable name="user-request" />
      
      Create a plan using these agents.
    </llm>
    
    <!-- Execute delegated tasks with error handling -->
    <try>
      <call name="flight-agent" />
      <call name="hotel-agent" />
    <catch name="booking_failed">
      <llm model="gpt-4" result="recovery-plan">
        Booking failed: <exception name="booking_failed" />
        Create alternative approach.
      </llm>
    </catch>
    </try>
  </subroutine>
  
  <!-- Entry point -->
  <defvar name="user-request">Plan a 3-day trip to Paris</defvar>
  <defvar name="destination">Paris</defvar>
  <call name="coordinator-agent" />
  
</subroutine>
```

**This demonstrates:**
- **Agent specialization**: Each agent has scoped tools
- **Multi-agent coordination**: Coordinator delegates to specialists
- **Hierarchical communication**: Agents pass data via variables
- **Error recovery**: Coordinator handles failures from specialists

## 11. Theoretical Foundation

### Dirac as a Process Calculus
Dirac's execution model resembles process calculi (π-calculus, CSP):
- **Processes**: Subroutines are composable processes
- **Communication**: Variables and parameters pass messages
- **Concurrency**: Future: parallel execution of independent subroutines
- **Scoping**: Boundaries provide lexical scope

This theoretical grounding makes Dirac's agentic capabilities not accidental but fundamental to its design.

### Boundary Algebra
The boundary system forms an algebraic structure:
- **Push boundary**: Creates new scope level
- **Pop boundary**: Returns to parent scope
- **Capture**: Extracts content between boundaries

This algebra applies uniformly to variables, subroutines, and output—a unifying abstraction.

## 12. Future Directions

### Parallel Agent Execution
```xml
<parallel>
  <call name="flight-agent" />
  <call name="hotel-agent" />
  <call name="activity-agent" />
</parallel>
```

### Dynamic Tool Discovery
Dirac already implements dynamic subroutine loading with `<load-context>`:
```xml
<subroutine name="intelligent-planner">
  <!-- Load relevant subroutines based on natural language description -->
  <load-context>
    Find tools related to travel booking, flight search, and hotel reservations
  </load-context>
  
  <!-- Now LLM has access to dynamically discovered tools -->
  <llm model="gpt-4" execute="true">
    Plan a trip to Paris using available tools
  </llm>
</subroutine>
```

**How it works:**
- `<load-context>` uses natural language to search for relevant subroutines
- Matching subroutines are pushed onto the session stack
- LLM automatically sees newly loaded tools in its context
- Enables just-in-time tool discovery based on task requirements

### Agent Learning and Memory
Agents can save learned patterns using `<save-subroutine>`:
```xml
<subroutine name="learning-agent">
  <!-- LLM generates new subroutine and loads it onto stack -->
  <llm model="gpt-4" execute="true">
    Based on past experiences with booking failures, generate a robust
    booking subroutine with retry logic and fallback options.
    
    <!--
    Created by LLM: <subroutine name="robust-booking" param-destination="string">
      <!-- Include retry logic and fallback handling -->
    </subroutine> -->
  </llm>
  
  <!-- Immediately available for use in this session -->
  <robust-booking destination="Paris" />
  
  <!-- Save to disk for future sessions -->
  <save-subroutine name="robust-booking" />
</subroutine>
```

**How it works:**
1. LLM generates `<subroutine>` tag in execute mode
2. Generated subroutine automatically loads onto session stack - **immediately usable**
3. Can call it right away in the current session
4. `<save-subroutine>` persists it to disk for future sessions
5. No variable intermediary needed - direct stack-to-storage

**Benefits:**
- Instant availability: use generated tools immediately in same session
- Session persistence: `<save-subroutine>` makes them available across sessions
- Agents accumulate experience over time
- Enables continuous improvement of agent capabilities

## Conclusion

Dirac's interpreter design makes it uniquely suited as an agentic runtime for LLM systems. Where other frameworks add orchestration layers, Dirac's core primitives—scoped subroutine stacks, hierarchical exception handling, and boundary-based scoping—naturally embody the requirements of autonomous agents:

1. **Tool Registry**: Subroutine stack provides scoped, discoverable tool sets
2. **Error Recovery**: Exception handling enables hierarchical replanning
3. **State Management**: Session boundaries manage multi-level state
4. **Declarative Syntax**: XML structure matches planning decomposition
5. **Native LLM Integration**: First-class language support for agent invocation

The runtime is not adapted for agentic use—it is agentic by design. This makes Dirac a compelling choice for building production LLM agent systems, from simple task automation to complex multi-agent orchestration.

## References

1. Dirac Language Documentation: [GETTING-STARTED.md](GETTING-STARTED.md)
2. Exception Handling: [EXCEPTION-HANDLING.md](EXCEPTION-HANDLING.md)
3. Boundary System: Implementation in [src/runtime/session.ts](src/runtime/session.ts)
4. LLM Integration: [LLM-DIALOG-CONTEXT.md](LLM-DIALOG-CONTEXT.md)

---

*This paper provides a conceptual framework. For implementation details, see the Dirac source code and documentation.*
