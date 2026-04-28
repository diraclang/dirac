# Attention: Our Understanding

**Working Notes on Attention Mechanisms and Symbolic Computation**  
**April 25-27, 2026**

## Core Insight (Revised)

**Initial understanding** (April 25): The transformer architecture can be reinterpreted as a two-stage process:
- **Attention layer** = Parameter binding (creating parameterized function calls)
- **Feed-forward layer** = Operator application (executing the function)

**Revised understanding** (April 27): Attention performs **both binding AND routing/computation** through its bilinear structure:
- **Attention layer** = Unified bind-route-compute mechanism via bilinear interaction `⟨Q|M|K⟩`
- **Feed-forward layer** = Representation transformation and refinement

The bilinear term `⟨Q_i|M|K_j⟩` in attention simultaneously:
1. **Binds parameters** (determines which tokens to combine)
2. **Routes computation** (selects which operation based on context)
3. **Performs computation** (the weighted combination produces results)

This unified view explains why attention is so powerful and why it's architecturally necessary for context-dependent symbolic computation.

---

## The Two-Stage Model (Original Framing)

*Note: This section presents our initial understanding. See "Attention as Unified Bind-Route-Compute" below for the revised perspective.*

### Symbolic System:

In symbolic computation, calling a function with arguments is a two-step process:

```python
def kick(object):
    return f"kicking {object}"

# Step 1: Bind parameters
call = kick(ball)  # object → ball

# Step 2: Execute function body
result = "kicking ball"
```

In bra-ket notation:
```
1. Pattern: ⟨kick object|          (function signature - bra)
2. Call:    |kick ball>            (function call with argument - ket)
3. Match:   ⟨kick object|kick ball⟩ = 1   (binding: object → ball)
4. Execute: |action>               (function body executes)
```

### Neural System (Transformer):

**Stage 1: Attention - Parameter Binding**
```
Input:  |kick>, |ball>             (separate tokens in context)
        ↓ (attention mechanism)
Output: |kick ball>                (unified parameterized ket)
```

Mathematical form:
```
|kick ball> = ∑ᵢ αᵢ·|vᵢ>
            = α_kick·|v_kick> + α_ball·|v_ball>
```

The attention weights αᵢ determine how strongly each context token contributes to the parameterized call.

**Stage 2: Feed-Forward - Operator Application**
```
Input:  |kick ball>                (parameterized call)
        ↓ (feed-forward network)
Output: |result>                   (function output)
```

Mathematical form:
```
|result> = σ(W₂·σ(W₁·|kick ball> + b₁) + b₂)
```

The matrices W₁, W₂ encode the "function body" - what the operator does when applied to the parameterized input.

---

## Why This Matters

### 1. Explains the Architecture

**Question:** Why do transformers need BOTH attention AND feed-forward?

**Traditional answer:** "Attention is linear, feed-forward adds non-linearity"

**Symbolic interpretation:** They serve different computational roles:
- Attention = parameter binding (creating the function call)
- Feed-forward = function execution (applying the operator)

Both are necessary because symbolic computation requires:
1. Constructing the call: `|function arg=value>`
2. Executing the call: `⟨pattern|function arg=value⟩ → |result>`

### 2. Explains the Ordering

**Question:** Why is attention always before feed-forward?

**Answer:** You must bind parameters before executing!

Just as in programming:
```python
def greet(name):      # Define function
    return f"Hello {name}"

greet("Alice")        # First: bind name="Alice"
                      # Then: execute body
```

In transformers:
```
Step 1 (Attention):     Bind parameters |kick> + α·|ball> → |kick ball>
Step 2 (Feed-forward):  Execute W·|kick ball> → |result>
```

Reversing this order would be meaningless - you can't execute a function without knowing its arguments!

### 3. Explains Layer Stacking

**Question:** Why do transformers stack multiple layers?

**Answer:** Each layer is one level of function composition!

```
Layer 1: |input> → [Attention → |call₁>] → [FF → |result₁>]
Layer 2: |result₁> → [Attention → |call₂>] → [FF → |result₂>]
Layer 3: |result₂> → [Attention → |call₃>] → [FF → |result₃>]
```

This is analogous to nested function calls:
```python
f(x)           # Layer 1
g(f(x))        # Layer 2  
h(g(f(x)))     # Layer 3
```

Each attention layer builds the next parameterized call, each feed-forward executes it.

---

## The Tensor Product Problem

### The Challenge

In symbolic systems, `|kick object=ball>` is a **structured expression**:
- Operator: "kick"
- Parameter slot: "object"
- Parameter value: "ball"

To fully preserve this structure mathematically, you'd need a **tensor product**:
```
|kick> ⊗ |ball>
```

This lives in a d₁ × d₂ dimensional space (dimension explosion!).

**Example:**
- |kick> is 512-dimensional
- |ball> is 512-dimensional
- |kick> ⊗ |ball> is 512 × 512 = 262,144 dimensional

This is computationally intractable for large vocabularies.

### The Attention Solution

Instead of tensor product, attention uses **weighted sum** (stays in same dimension):
```
|kick ball> = α₁·|kick> + α₂·|ball>
```

Still 512-dimensional, but with information from both tokens mixed together.

**This is why attention is necessary:**
1. Keeps representation in manageable dimensions (no explosion)
2. Binds parameters through continuous mixing (analog of discrete binding)
3. Creates unified representation that feed-forward can process
4. Remains differentiable (enables gradient-based learning)

**Trade-off:**
- ✅ Computationally tractable
- ✅ Differentiable
- ❌ Lossy (cannot perfectly separate |kick> and |ball> afterward)
- ❌ Requires learning which dimensions encode what

---

## Two Views: Context vs. Argument

### Context View (Standard Interpretation)

Attention gathers relevant information from context:
```
Query: "What should I know about kick?"
Context: [|kick>, |ball>, |field>, |player>, ...]
Output: Weighted combination of relevant context
```

Emphasis: **Information retrieval and aggregation**

### Argument View (Symbolic Interpretation)

Attention binds parameters to create function calls:
```
Function: kick
Parameters needed: object
Available values: ball, field, player
Output: |kick object=ball> (bound call)
```

Emphasis: **Parameter binding and structure creation**

### Both Are Valid!

These are two perspectives on the same mechanism:

**Context view:** Focuses on where information comes from (the source)
- "The model attends to relevant context tokens"
- Explains: how knowledge is retrieved from memory

**Argument view:** Focuses on what structure is being created (the result)
- "The model binds arguments to create parameterized calls"
- Explains: why the resulting vector has specific computational semantics

**Unified view:** Attention is simultaneously:
- Retrieving information from context (context view)
- Binding parameters to operators (argument view)

---

## The Structural Traceability Question

### In Symbolic Systems: Clear Separation

```
|kick object=ball>
   ↑      ↑      ↑
   |      |      └─ argument value (data)
   |      └──────── parameter slot (type/role)
   └─────────────── operator name (opcode)
```

Like CPU instructions:
```
[ADD][R1][R2][R3]
  ↑    └────┴────── arguments (data registers)
  └──────────────── opcode (drives ALU)
```

- Bits 0-7: opcode → determines which circuit activates
- Bits 8-31: arguments → provides data

**Structurally explicit** - different bit positions have different roles.

### In Neural Networks: Blurred Structure

After attention, we have:
```
|kick ball> = α₁·embed("kick") + α₂·embed("ball")
            = [0.2, -0.5, 0.8, ..., 0.3, 0.1, -0.2]
                          ↑
                  all mixed together!
```

**The Open Question:** In this 512-dimensional vector, can we identify:
- Which dimensions encode the "opcode" (which function)?
- Which dimensions encode the "arguments" (what data)?

### Hypothesis 1: Emergent Separation

The network might learn to partition the embedding space:
```
Dimensions 1-256:   "Function/operator space"
Dimensions 257-512: "Argument/data space"
```

**How this could work:**
- Feed-forward W₁ matrix has implicit structure
- First 256 dims of |kick ball> drive "which function to execute"
- Last 256 dims provide "what data to operate on"

**How to test:**
1. Probe embeddings: Do similar functions cluster in certain dimensions?
2. Analyze W₁ weights: Are some neurons sensitive to specific dimension ranges?
3. Ablation study: Zero out different dimension ranges, measure what breaks

### Hypothesis 2: Distributed Representation

No clean separation - everything is entangled:
```
Every dimension encodes mixture of:
- Function identity
- Argument values
- Context information
- Positional information
- ...
```

**Why this might happen:**
- Training optimizes for task performance, not interpretability
- Superposition: network packs more concepts than dimensions
- Holographic encoding: each dimension contributes to multiple aspects

**Evidence from research:**
- Polysemanticity: single neurons respond to multiple unrelated concepts
- Feature superposition: more features than dimensions available
- Distributed representations often more efficient

### Likely Reality: Soft Partition

**Neither pure separation nor pure distribution, but something in between:**

- Some dimensions carry more "opcode-like" information
- Some dimensions carry more "argument-like" information  
- Significant overlap and entanglement exists
- Structure is implicit in computation, not explicit in representation

**Analogy:** Holographic storage
- Every piece contains information about the whole
- Different regions emphasize different aspects
- Cutting in half doesn't cleanly separate structure

---

## Implications for Understanding

### 1. Attention Weights as Parameter Selectors

When you visualize attention weights, you're seeing:
- Which parameters are being bound to which values
- How strongly each context token contributes to the parameterized call
- The "argument gathering" process in action

### 2. Feed-Forward Matrices as Function Libraries

The W₁, W₂ matrices encode:
- A continuous space of possible functions
- Different regions of input space activate different "function implementations"
- Soft dispatch over a continuous function library
- Non-linearity provides threshold-based selection (soft version of symbolic matching)

### 3. Multi-Head Attention as Multiple Parameter Slots

Different attention heads bind different kinds of parameters:
- Head 1: subject-verb binding
- Head 2: verb-object binding
- Head 3: modifier-noun binding
- Head 4: location-time binding

Just like symbolic functions have multiple named parameters:
```python
def action(subject, verb, object, location, time):
    ...
```

Each head specializes in filling one type of slot.

### 4. Residual Connections

```
output = x + Attention(x) + FF(Attention(x))
```

**Possible interpretation:**
- Preserves the original call structure through layers
- Allows information to bypass if transformation isn't needed
- Maintains a "memory" of what was requested, not just the result

**Alternative:** Just a training optimization (helps gradient flow)

Both may be true!

---

## The QKV Projections

```
Q = M_q·X    (Query projection)
K = M_k·X    (Key projection)  
V = M_v·X    (Value projection)
```

### Symbolic Interpretation:

**M_q: Query Space**
- Transforms input into "what am I asking for?" representation
- In symbolic: "What function am I trying to call?"
- Encodes the request/need

**M_k: Key Space**
- Transforms context into "what can I match against?" representation
- In symbolic: "What parameters are available in scope?"
- Encodes the available options

**M_v: Value Space**
- Transforms context into "what actual information do I provide?" representation
- In symbolic: "What are the parameter values?"
- Encodes the data to be bound

**Type-checking analogy:**

In typed symbolic systems:
```python
def kick(object: PhysicalObject) -> Action:
    ...

kick(ball)  # Type checker verifies: ball is PhysicalObject ✓
```

The QKV projections might be performing **soft type matching**:
- Q projects the request into "function signature space"
- K projects available values into "compatible parameter space"
- V provides the actual bound values
- Dot product ⟨K|Q⟩ is soft type compatibility check

---

## Self-Attention Reinterpreted

When a token attends to itself and other tokens:

### Traditional View:
"The token gathers contextual information to refine its representation"

### Argument View:
Each token is simultaneously:
1. **Asking:** "What parameters do I need to execute?"
2. **Gathering:** Context from other tokens that provide those parameters
3. **Building:** A parameterized version of itself (ready to execute)

**Example:**
```
Input: "The dog kicked the ball"
Token: "kicked"

Self-attention:
- Attends to "dog" (subject/agent parameter)
- Attends to "ball" (object/patient parameter)
- Attends to "the" (definiteness marker)
- Creates: |kicked agent=dog patient=ball definite=true>
```

The result is not just "kicked with context" but specifically "kicked with bound parameters ready for execution."

---

## Empirical Evidence: The Word2Vec Example

### The Classic |Queen> = |Ruler> + |Female>

One of the most famous results from word embeddings provides concrete evidence for dimension separation:

```
|King>   = |ruler> + |male>
|Queen>  = |ruler> + |female>
|Man>    = |male>
|Woman>  = |female>
```

**The famous vector arithmetic:**
```
|King> - |Man> + |Woman> = |Queen>

Expanding:
(|ruler> + |male>) - |male> + |female> = |ruler> + |female>
```

This works because word2vec **learned to separate dimensions**:
- Some dimensions encode "role/occupation" (ruler, worker, artist, ...)
- Other dimensions encode "gender" (male, female, neutral, ...)
- These are largely **orthogonal subspaces**

### Dimension Specialization

Empirical studies have shown that embeddings develop structure:

**Example breakdown of 300-dimensional embedding:**
- Dimensions 1-100: Role/occupation information
  - High values for: king, queen, president, worker, artist
  - Encodes: what kind of entity is this?

- Dimensions 101-200: Gender information
  - Positive values: male-associated
  - Negative values: female-associated
  - Near zero: gender-neutral

- Dimensions 201-250: Number (singular/plural)
  - High: plural entities
  - Low: singular entities

- Dimensions 251-300: Animacy
  - High: living things
  - Low: inanimate objects

**This has been empirically verified through:**
1. Linear probing classifiers
2. PCA revealing semantic axes
3. Causal intervention studies
4. Attention pattern analysis

### Attention with Separated Dimensions

When attention combines tokens with separated dimensions:

```
Input tokens: |female>, |ruler>

Attention computes:
|Queen> = α_female·|v_female> + α_ruler·|v_ruler>
```

**If dimensions are separated:**

```
|v_female> = [0, 0, ..., 0, 1.0, 0, ..., 0]
              └─role dims─┘ └─gender─┘ └─rest─┘
                          ↑ spike in "gender" dimensions

|v_ruler>  = [0.8, 0.5, ..., 0, 0, 0, ..., 0]
              └─spike─┘ └─gender─┘ └─rest─┘
              ↑ spike in "role" dimensions

|Queen> = α_female·|v_female> + α_ruler·|v_ruler>
        = [0.8α_ruler, 0.5α_ruler, ..., 1.0α_female, 0, ..., 0]
          └────── role info ────────┘  └─ gender ─┘
```

**Key insight:** The dimensions don't interfere because they're orthogonal!
- Role information occupies dims 1-100
- Gender information occupies dims 101-200
- Adding them preserves both types of information

### Mapping to Opcode/Argument Separation

This is **exactly analogous** to the |kick ball> parameter binding:

**Word embedding example:**
```
|Queen> = |ruler> + |female>
          └─role─┘   └─attribute─┘
          dims 1-100  dims 101-200
```

**Function call example:**
```
|kick ball> = |kick> + α·|ball>
              └─action─┘  └─object─┘
              dims 1-256  dims 257-512
```

**Both use dimension separation for compositional structure!**

### Why Vector Addition Works

The addition |A> + |B> encodes both pieces of information **because:**

1. **Orthogonal subspaces:** 
   - A occupies dimensions [1-100]
   - B occupies dimensions [101-200]
   - No overlap → no interference

2. **Feed-forward can decode:**
   ```
   W₁ row i: [0.9, 0.8, ..., 0, 0, ...]  ← sensitive to dims 1-100
             reads "what role?"
   
   W₁ row j: [0, 0, ..., 0.7, 0.9, ...]  ← sensitive to dims 101-200
             reads "what gender?"
   ```

3. **Independent variation:**
   - Change role without changing gender: modify dims 1-100 only
   - Change gender without changing role: modify dims 101-200 only
   - Enables compositional generalization

### CPU Instruction Analogy Revisited

This makes the hardware analogy **concrete**:

**CPU instruction encoding:**
```
[opcode: 8 bits][register1: 5 bits][register2: 5 bits][immediate: 16 bits]
 └─determines ALU operation─┘ └────provides data addresses────┘
```

**Neural embedding (with separated dimensions):**
```
[action dims: 1-256][object dims: 257-384][location dims: 385-512]
 └─determines which function─┘ └───provides argument values───┘
```

**Both use positional encoding of semantic roles!**

The difference:
- CPU: Discrete bits, hard boundaries, explicit decoder
- Neural: Continuous dimensions, soft boundaries, learned decoder

But the principle is identical: **different "bit positions" (dimensions) encode different semantic roles**.

### Evidence from Transformer Research

Recent mechanistic interpretability work confirms this:

**1. Attention Head Specialization:**
- Some heads attend based on syntactic role (subject-verb-object)
- Some heads attend based on semantic type (animate vs. inanimate)
- Different heads appear to read different dimension subspaces

**2. Residual Stream Structure:**
- Early layers write syntactic information to certain dimensions
- Middle layers write semantic information to different dimensions  
- Late layers read from specific dimension ranges for specific tasks

**3. Probing Classifiers:**
- Linear probes can predict syntactic features from dimension ranges
- Different ranges predict different features
- Suggests structured allocation of dimensions to semantic types

**4. Causal Interventions:**
- Editing specific dimensions changes specific properties
- Gender dimensions: can swap gender without changing other properties
- Number dimensions: can change singular↔plural independently
- Evidence for functional specialization

### Implications

This empirical evidence suggests:

**Hypothesis:** Neural networks **do** learn to separate opcode-like and argument-like information into different dimensions, similar to how word2vec separated role from gender.

**Mechanism:** Not hard-coded, but emerges from:
- Optimization pressure for efficiency
- Compositional generalization requirements
- Linear separability of different semantic types
- Gradient flow considerations

**Degree of separation:** Likely **soft** rather than **hard**:
- Not perfectly orthogonal (some leakage between subspaces)
- Not fixed boundaries (fuzzy borders between semantic regions)
- But statistically significant clustering
- Enough structure for linear algebra to work

**Testable prediction:** In |kick ball>:
- Dimensions encoding "action type" should cluster together
- Dimensions encoding "object identity" should cluster separately
- Attention should preserve this separation
- Feed-forward should read from both subspaces

This could be empirically verified using the same techniques that revealed word2vec's structure!

---

## Tensor Product vs. Mixed Representations

### The Fundamental Distinction

There are two ways to represent compound structures in neural networks, with profoundly different properties:

#### Representation 1: Concatenation (Preserves Tensor Product)

```
|kick ball> = [|kick> | |ball>]
            = [1,0,0,0,0 | 0,1,0,0,0]
              └─ verb ─┘   └─ object ─┘
```

**This is a flattened tensor product:**
```
|kick> ⊗ |ball> ≈ [|kick> | |ball>]
```

**Properties:**
- Verb and object remain **completely separated** in different dimension blocks
- Can be perfectly decomposed back into components
- Natural for factorizable transformations

#### Representation 2: Mixing (Breaks Tensor Product)

```
|kick ball> = α·|kick> + β·|ball>
            = [0.7, 0.1, 0.3, ..., 0.5, 0.2]
              ↑ mixed together - cannot separate cleanly
```

**Properties:**
- Verb and object information **blended** across all dimensions
- Cannot perfectly decompose back into components (lossy)
- Necessary for coupled/non-factorizable transformations

---

### Weight Matrix Structure Reveals the Difference

#### Block-Structured W (Respects Tensor Product)

For the transformation "kick ball" → "ball kicked":

```
W = [  0    | Copy  ]  ← Object output reads ONLY from object input
    [Trans  |   0   ]  ← Verb output reads ONLY from verb input
```

**Example (10×10 matrix):**
```python
W = [
    # Output positions 0-4 (object space)
    [0, 0, 0, 0, 0,  0, 1, 0, 0, 0],  # copy ball
    [0, 0, 0, 0, 0,  0, 0, 1, 0, 0],  # copy wall
    [0, 0, 0, 0, 0,  0, 0, 0, 1, 0],  # copy table
    ...
    
    # Output positions 5-9 (verb space)
    [1, 0, 0, 0, 0,  0, 0, 0, 0, 0],  # kick → kicked
    ...
]
```

**Verification:**
```python
Input:  [1,0,0,0,0, 0,1,0,0,0]  # "kick ball"
         └─ kick ─┘  └─ ball ─┘

Output: [0,1,0,0,0, 0,0,0,0,1]  # "ball kicked"
         └─ ball ─┘  └─ kicked ─┘
```

**Block structure means:**
- Upper-left block (0): object output doesn't read verb input
- Upper-right block (Copy): object output copies object input  
- Lower-left block (Trans): verb output transforms verb input
- Lower-right block (0): verb output doesn't read object input

**This is exactly tensor product behavior!**

The transformation factors as:
```
f(verb, object) = (g(verb), h(object))
                = (verb+ed, object)
```

Each component transforms independently.

#### Full W (No Tensor Product)

For non-factorizable transformations like:
```
"kick lightly" → "tap"
"kick hard" → "punt"
```

The output depends on the **combination**, not independently:

```
W = [w11  w12]  ← "tap" reads from BOTH verb AND adverb
    [w21  w22]  ← "punt" reads from BOTH verb AND adverb
```

**All blocks active** - no clean separation!

The transformation CANNOT factor:
```
f("kick", "lightly") = "tap"  ≠ (g("kick"), h("lightly"))
```

---

### When Does Each Regime Apply?

#### Factorizable Transformations → Tensor Product Works

**Examples:**
1. **Reordering:** `(verb, object) → (object, verb)`
   - Block-diagonal W (permutation matrix)
   
2. **Independent morphology:** `(verb, tense) → (verb+tense, ...)`
   - "kick" + "past" → "kicked"
   - Tense transformation doesn't depend on specific verb

3. **Attribute composition:** `|Queen> = |ruler> + |female>`
   - Role and gender are independent attributes
   - Can be changed separately

#### Coupled Transformations → Mixing Required

**Examples:**
1. **Idiomatic expressions:** `("kick", "bucket") → "die"`
   - Output depends on specific combination
   - Cannot decompose

2. **Context-dependent meaning:** 
   - "bank" + "river" → "shore"
   - "bank" + "money" → "financial institution"
   - Meaning of "bank" depends on context

3. **Semantic composition:**
   - "very" + "good" → "excellent" (not just "very" + "good")
   - Non-compositional semantics

---

### Why Attention Breaks Tensor Product Structure

**Attention mechanism:**
```
|output> = ∑ᵢ αᵢ·|vᵢ>
         = α_kick·|v_kick> + α_ball·|v_ball>
```

This **weighted sum** destroys the block structure:

**Before attention (concatenated):**
```
[|kick> | |ball>]  ← tensor product preserved
 └─block 1─┘└─block 2─┘
```

**After attention (mixed):**
```
α·|kick> + β·|ball>  ← tensor product destroyed
  ↑ all dimensions mixed
```

**Why this is necessary:**

1. **Expressivity:** Can represent coupled relationships
2. **Flexibility:** Output dimensions can attend to any input dimensions
3. **Generalization:** Learns which combinations matter through training

**The trade-off:**
- ✅ Can handle non-factorizable transformations
- ✅ More powerful (universal approximation)
- ❌ Loses clean interpretability
- ❌ Cannot perfectly recover original components

---

### Transformers Use BOTH Strategies

**Residual connections preserve structure:**
```
output = x + Attention(x) + FF(Attention(x))
         ↑ original input preserved
```

The original `x` maintains some tensor product structure through the residual path.

**Attention breaks structure:**
```
Attention(x) = ∑ᵢ αᵢ·|vᵢ>  ← mixing happens here
```

Creates coupled representations when needed.

**Feed-forward exploits whatever structure exists:**
- If input has block structure → W can be block-diagonal (efficient)
- If input is mixed → W needs full connections (expressive)
- Learned through training which structure to use

**The architecture balances:**
- Residual paths: preserve factorizable structure (efficiency, interpretability)
- Attention: break structure when necessary (expressivity, flexibility)
- Feed-forward: adapt to whatever representation is present

---

### Implications for Understanding

#### 1. Two Computational Regimes

**Regime A: Block-structured (tensor product)**
- Factorizable transformations
- Clean dimension separation
- Efficient (sparse W)
- Interpretable (can trace which dimension does what)

**Regime B: Full-mixing (broken tensor product)**
- Coupled transformations
- Blended dimensions
- Expressive (dense W)
- Opaque (holographic representation)

**Real models exist on a spectrum** between these extremes.

#### 2. Why Simple Tasks Don't Need Attention

For purely factorizable tasks:
```
(verb, object) → (object, verb+ed)
```

A simple block-structured W suffices - **no attention needed!**

This explains why:
- Feedforward networks work well on simple classification
- Recurrent networks work for sequence-to-sequence when mappings are local
- Attention becomes critical when relationships are **non-local and coupled**

#### 3. The Role of Training

Training learns **how much mixing to use**:

- If data is factorizable → gradients push toward block structure
- If data is coupled → gradients push toward full mixing
- Optimization finds the right balance

**Evidence:**
- Pruning studies show many attention heads can be removed (learned redundancy)
- Some heads become highly specialized (block-like)
- Other heads remain fully mixed (truly coupled)

#### 4. Connection to Symbolic AI

**Symbolic systems assume factorizable structure:**
```
|kick object=ball> 
  ↑ function name (block 1)
     ↑ parameter name (metadata)
              ↑ parameter value (block 2)
```

Clean separation by design!

**Neural systems learn whether to preserve it:**
- If task allows → block structure emerges
- If task requires coupling → mixing emerges
- **Automatic** rather than designed

---

### Experimental Predictions

Based on this analysis, we predict:

**1. Simple factorizable tasks:**
- W matrices should show block structure
- Attention weights should be sparse/peaked
- Dimension probing should find clean separation

**2. Complex coupled tasks:**
- W matrices should be dense
- Attention weights should be diffuse
- Dimension probing should find distributed representations

**3. Mixed tasks:**
- Some layers preserve structure (block W)
- Other layers break structure (full W)
- Early layers more structured, late layers more mixed

These are **testable hypotheses** using mechanistic interpretability tools!

---

### Summary: Two Faces of Parameter Binding

**Tensor Product View (Concatenation):**
```
|function param=value> ≈ [|function> | |value>]
```
- Preserves structure
- Block-diagonal W
- Efficient, interpretable
- Limited to factorizable transformations

**Mixed View (Attention):**
```
|function param=value> ≈ α·|function> + β·|value>
```
- Breaks structure
- Full W
- Expressive, powerful
- Necessary for coupled transformations

**Real transformers use both:**
- Residual connections maintain tensor product structure where possible
- Attention breaks it where necessary
- Feed-forward adapts to whatever emerges

**The deep insight:** What appears as a single "parameter binding" operation in symbolic AI actually corresponds to **two different neural mechanisms** depending on whether the transformation is factorizable or coupled.

This duality is fundamental to understanding why transformers work!

---

## Open Questions

### 1. Empirical Verification

Can we experimentally verify that:
- Attention creates parameter-bound representations?
- Feed-forward executes operations on those representations?
- The separation of roles is real, not just interpretative?

**Proposed experiments:**
- Ablate only attention: Can the model still execute, but with wrong parameters?
- Ablate only feed-forward: Can the model gather context but not act on it?
- Analyze information flow: Does attention increase "parameter-ness" and FF increase "result-ness"?

### 2. Architectural Implications

If this interpretation is correct:
- Could we design better architectures that make this separation explicit?
- Should we have separate "parameter binding" and "execution" modules?
- Would explicit structure improve interpretability without hurting performance?

### 3. Optimization and Learning

Does the network explicitly learn this separation, or does it emerge?
- Is there gradient pressure to separate opcode vs. argument dimensions?
- Do different training objectives lead to different degrees of separation?
- Can we add regularization to encourage explicit structure?

### 4. Scaling Implications

As models get larger:
- Does the opcode/argument separation become clearer or more blurred?
- Do models learn more structured representations or compress further?
- Is there a trade-off between structure and efficiency?

### 5. Connection to Neuroscience

Does the brain have analogous separation?
- Prefrontal cortex = parameter binding (working memory)?
- Motor cortex = execution (action selection)?
- Different neural populations for "what to do" vs. "how to do it"?

---

## Relation to RNN

### RNN: Sequential Parameter Binding

In RNNs, `|kick>` and `|ball>` are processed sequentially:

```
t=0: h₀ = initial state
t=1: h₁ = RNN(h₀, |kick>)
t=2: h₂ = RNN(h₁, |ball>)
```

The final hidden state h₂ accumulates information:
```
h₂ = W_h²·h₀ + W_h·W_x·|kick> + W_x·|ball>
```

**Interpretation:**
- h₁ encodes "kick is happening"
- h₂ encodes "kick is happening to ball"
- Sequential accumulation = step-by-step parameter binding

**Problem:** Order-dependent!
- `|kick>|ball>` ≠ `|ball>|kick>`
- Temporal ordering matters
- Cannot bind parameters in parallel

### Transformer: Parallel Parameter Binding

Attention processes all tokens simultaneously:
```
|kick ball> = α_kick·|v_kick> + α_ball·|v_ball>
```

**Advantages:**
- Order-independent (after positional encoding adjustment)
- Parallel computation (faster)
- Can attend to distant context

**Connection:**
- RNN = sequential parameter accumulation (like building a stack frame step-by-step)
- Transformer = parallel parameter binding (like filling all slots simultaneously)
- Both create parameterized representations, different strategies

---

## Connections to the Main Paper

This document explores ideas related to the paper "Bra-Ket Duality: Unifying Symbolic and Neural Computation Through Dirac Notation" but goes deeper into the architectural interpretation.

**Main paper establishes:**
- Symbolic and neural computation share bra-ket structure
- Attention has sandwich form: M₁|o⟩⟨o|M₂|x⟩
- Parameter binding in symbolic = context mixing in neural (Section 5.4)

**This document adds:**
- Explicit two-stage interpretation (attention = binding, FF = execution)
- Analysis of why both stages are necessary
- Discussion of structural traceability
- Open questions about emergent vs. explicit structure

**Possible future work:**
- Empirical paper testing these hypotheses
- Architectural innovations based on this understanding
- Mechanistic interpretability studies examining opcode/argument separation

---

## Summary

**Core thesis:** The transformer architecture implements a two-stage symbolic computation:

1. **Attention** = Parameter binding mechanism
   - Gathers context tokens
   - Creates unified parameterized representation
   - Continuous analog of `|function arg=value>`

2. **Feed-forward** = Operator application
   - Acts on parameterized representation
   - Computes function result
   - Continuous analog of executing function body

**Why this matters:**
- Explains architectural choices (why both components needed, why this order)
- Provides symbolic semantics for neural operations
- Connects transformer design to classical computation principles
- Opens questions about structure, interpretability, and optimization

**Open challenge:** Understanding how much of this structure is explicit in the learned representations vs. implicit in the computation.

---

## Stack-Based Execution and Tensor Product vs Direct Sum

**Discussion - April 27, 2026**

### The Dimension Problem in Symbolic-to-Neural Mapping

A critical question arises when mapping symbolic stack-based execution to neural operations: **Why don't neural networks use full tensor products?**

#### Pure Functional Programming: The Exponential Cost

Consider nested closures (pure functional programming):

```xml
<subroutine name="kick">
  <subroutine name="ball">
    ... computation ...
  </subroutine>
</subroutine>
```

Called as: `<kick><ball/></kick>`

The stack represents a **tensor product**:
```
|stack⟩ = |kick⟩ ⊗ |ball⟩ ⊗ |color⟩ ⊗ ...
```

If each embedding has dimension `d`, the tensor product requires:
```
d^n dimensions for n nested levels
```

**This is exponentially expensive!**

#### What Neural Networks Actually Do: Direct Sum

Instead of tensor product:
```
|a⟩ ⊗ |b⟩ ∈ ℝ^(d₁ × d₂)   [exponential growth]
```

Neural networks use concatenation (direct sum):
```
|a⟩ ⊕ |b⟩ ∈ ℝ^(d₁ + d₂)   [linear growth]

concat([kick, ball, color]) = d + d + d = 3d dimensions
```

### The Solution: Parametric Binding, Not Nesting

The key insight is that **Dirac doesn't use pure functional nesting** for parameters. Instead:

```xml
<subroutine name="kick" param-object="String">
  ... use object parameter ...
</subroutine>
```

Called as: `|kick ball⟩`

This is **NOT a tensor product**:
```
|kick ball⟩ ≠ |kick⟩ ⊗ |ball⟩    [tensor product - exponential]
|kick ball⟩ = |kick⟩ + α|ball⟩   [linear combination - linear!]
```

### Parameter Passing = Attention-Based Mixing

**Symbolic view:**
```
Call: |kick ball⟩
Semantics: Bind parameter "object" to value "ball"
```

**Neural view:**
```
Attention computes mixing coefficient α:
  α = softmax(W_q|kick⟩ · W_k|ball⟩)

Creates mixed state:
  |kick ball⟩ = |kick⟩ + α|ball⟩

Feed-forward executes on mixed state:
  result = MLP(|kick⟩ + α|ball⟩)
```

### Why This Works: Information Preservation

**Direct sum (concatenation) preserves information** without exponential cost:
- `concat([kick, ball])` is injective (can recover both components)
- Maintains **linear dimensions** while preserving compositionality
- **Attention dynamically computes** context-dependent mixing (α is not fixed)

### Comparison of Approaches

| Approach | Representation | Dimensions | Use Case |
|----------|---------------|------------|----------|
| **Tensor Product** | `\|a⟩ ⊗ \|b⟩` | d^n | Pure functional (nested closures) |
| **Direct Sum** | `\|a⟩ ⊕ \|b⟩` | n·d | Concatenation (separate components) |
| **Parametric Binding** | `\|a⟩ + α\|b⟩` | d | Parameter passing (attention) |

### The Two-Stage Architecture Revisited

With this understanding, the transformer architecture becomes clear:

**Stage 1: Attention (Parameter Binding)**
```
Input:  |kick⟩, |ball⟩              (separate embeddings)
Compute: α = attention(kick, ball)  (context-dependent)
Output: |kick ball⟩ = |kick⟩ + α|ball⟩  (bound parameters)
```

**Stage 2: Feed-Forward (Function Execution)**
```
Input:  |kick ball⟩                (parameterized state)
Apply:  W₂ · ReLU(W₁ · |kick ball⟩) (execute function)
Output: |result⟩                   (computed value)
```

### Key Insights

1. **Parametric calls use linear combinations**, not tensor products
   - Avoids exponential dimension growth
   - Matches neural network architecture naturally

2. **Attention computes context-dependent mixing**
   - α is not fixed; it depends on both function and argument
   - Enables flexible parameter binding

3. **Stack machines can be emulated efficiently**
   - No need for exponential-dimensional tensor spaces
   - Direct sum + attention provides sufficient expressive power

4. **This explains why transformers work**
   - Architecture matches the computational model
   - Attention is not just "useful" - it's **necessary** for parameter binding
   - Feed-forward is not redundant - it's the execution stage

### Implications for Dirac Implementation

The symbolic system (Dirac) uses:
- Variable stack for local variables
- Subroutine stack for call frames
- Parameter binding via name-value pairs

The neural analog would:
- Use sequence positions as "stack frames"
- Attention for dynamic parameter binding (creating mixed states)
- Feed-forward for executing operations on bound states
- Position encodings for tracking stack depth/scope

This provides a clear path for implementing **differentiable symbolic execution** where symbolic operations compile to neural operations while preserving semantics.

---

## Block-Structured Matrices: Making Tensor Operations Linear

**Working Notes - April 27, 2026**

### The Flattening Question

Can we flatten high-dimensional tensor operations (d^n) into low-dimensional matrix operations (n·d)?

**Answer**: Yes, but only with **structured embeddings**.

### Three Scenarios for Parametric Operations

#### 1. Unstructured Embeddings (Generic Case)
- Template operations require full tensor product: **d^n dimensions**
- Example: `|kick ball⟩` needs to examine all d² combinations
- No way to flatten to linear matrix operation
- Why: No assumptions about where information lives in the d-dimensional vector

#### 2. Structured Embeddings (Block-Organized) ✓
- **YES, matrices work!** Linear operations in **n·d dimensions**
- Dimension separation: [opcode | operand | result]
- Block-structured W selectively operates on regions
- This is **exact**, not approximation

#### 3. Learned Approximations (Current Neural Nets)
- Use concatenation (2d dims) but rely on non-linearity
- ReLU and deep layers approximate template operations
- Works empirically but no guarantees

### Concrete Example: `|kick ball⟩`

**Setup** (d=100 dimensions per component):

Input state vector (300-dim total):
```
x = [opcode (0-99)  | operand (100-199) | result (200-299)]
  = [kick_emb       | ball_emb          | zeros           ]
```

Block-structured weight matrix W (300×300):
```
W = ┌─────────────┬─────────────┬─────────────┐
    │  I₁₀₀       │   0         │   0         │  rows 0-99
    │ (identity)  │             │             │
    ├─────────────┼─────────────┼─────────────┤
    │   0         │  I₁₀₀       │   0         │  rows 100-199
    │             │ (identity)  │             │
    ├─────────────┼─────────────┼─────────────┤
    │  W₃₁        │  W₃₂        │   0         │  rows 200-299
    │ (100×100)   │ (100×100)   │             │
    └─────────────┴─────────────┴─────────────┘
      cols 0-99     cols 100-199  cols 200-299
```

**Matrix multiplication**: y = W @ x

```python
# Block 1: Preserve opcode
y[0:100] = I₁₀₀ @ kick_emb + 0 @ ball_emb + 0 @ zeros
         = kick_emb  ✓

# Block 2: Preserve operand  
y[100:200] = 0 @ kick_emb + I₁₀₀ @ ball_emb + 0 @ zeros
           = ball_emb  ✓

# Block 3: Compute result
y[200:300] = W₃₁ @ kick_emb + W₃₂ @ ball_emb + 0 @ zeros
```

What W₃₁ and W₃₂ learn:
- **W₃₁**: Transform verb → `W₃₁ @ kick_emb ≈ kicked_emb`
- **W₃₂**: Copy object → `W₃₂ @ ball_emb ≈ ball_emb`

**Final output**:
```
y = [kick_emb | ball_emb | kicked_emb + ball_emb]
  = [kick     | ball     | "ball-kicked"        ]
```

### Compositional Generalization

**Key insight**: W₃₁ does NOT change when operand changes!

**Case 1**: `|kick ball⟩`
```
x₁ = [kick_emb | ball_emb  | zeros]
y₁ = [kick     | ball      | "ball-kicked"]
```

**Case 2**: `|kick stone⟩` (SAME W!)
```
x₂ = [kick_emb | stone_emb | zeros]
y₂ = [kick     | stone     | "stone-kicked"]
```

**Why this works**:
- **W₃₁ is verb-specific, NOT object-specific**
  - `W₃₁ @ kick_emb = kicked_emb` (same for any object!)
  - Learned invariant: "transform 'kick' action to 'kicked' state"

- **W₃₂ is object-generic**
  - `W₃₂ @ ball_emb ≈ ball_emb` (preserve identity)
  - `W₃₂ @ stone_emb ≈ stone_emb` (same transformation)

- **Addition composes them**
  - `kicked_emb + ball_emb = "ball-kicked"`
  - `kicked_emb + stone_emb = "stone-kicked"`

### Zero-Shot Composition Test

Train on:
- `|kick ball⟩ → "ball-kicked"`
- `|throw ball⟩ → "ball-thrown"`

Test on **unseen combination**:
- `|throw stone⟩` (never seen!)

If block structure is correct:
```
W₃₁ @ throw_emb + W₃₂ @ stone_emb = "stone-thrown"  ✓
```

**Comparison**:
- ❌ **Memorization**: Separate weights for each (verb, object) pair → d² parameters per operation
- ✅ **Compositional structure**: Shared W₃₁ across objects, W₃₂ across verbs → 2d² parameters total

### Training Requirements

**Works IF**:
1. Embeddings for verbs occupy similar subspaces (W₃₁ acts uniformly)
2. Embeddings for objects occupy similar subspaces (W₃₂ acts uniformly)
3. Addition in embedding space is compositional (standard assumption)
4. Training loss encourages factorization

**The risk**:
- Without structure enforcement, SGD might learn dense W that memorizes
- **Solutions**: 
  - Initialize W as block-diagonal
  - Regularize to maintain block structure
  - Use hard architectural constraints

### Summary: When Flattening Works

Matrix (low-dimensional) flattening of tensor operations is possible **if and only if**:

1. **Structured embeddings**: Dimension allocation matches symbolic operation structure
2. **Block-structured weights**: Preserve compositionality while avoiding exponential growth
3. **Training constraints**: Enforce or encourage structural invariants

This suggests **differentiable symbolic execution** could be linear if we:
- Design embeddings with semantic dimension allocation: [function|argument|context]
- Initialize weights as block-structured matrices
- Enforce structure during training (regularization or hard constraints)

The "flattening" works because **block structure preserves compositionality** while keeping operations in n·d dimensions instead of d^n.

---

## Context Binding: Tensor vs Parametric Representations

**Working Notes - April 27, 2026**

### Two Models of Context

Consider the difference between:
1. **Sequential (tensor)**: `|context-1⟩|do-something⟩`
2. **Parametric (named)**: `|do-something context=context-1⟩`

These look similar semantically but have vastly different computational requirements.

### The Tensor Approach (Easy but Expensive)

**Sequential composition**: `|context-1⟩|do-something⟩`

Tensor representation:
```
|result-1⟩ = ⟨do-something|⟨context-1| · |context-1⟩|do-something⟩
```

Properties:
- Each context gets its own functional: `⟨do-something|context-1|`, `⟨do-something|context-2|`, ...
- The bra side has **d² dimensions** (all combinations)
- Matching is exact: `⟨context-1|context-1⟩ = 1`, `⟨context-1|context-2⟩ = 0`
- **Easy to define** because each (context, action) pair has independent parameters

**Cost**: **d^n dimensions** for n context variables

This is straightforward because the tensor product naturally creates orthogonal basis states for each context-action combination.

### The Parametric Approach (Hard but Efficient)

**Named parameter**: `|do-something context=context-1⟩`

Must represent in low-dimensional space:
```
|result-1⟩ = ⟨do-something|context| · |do-something context=context-1⟩
```

**The challenge**:
- The bra `⟨do-something|context|` is generic (doesn't specify which context value)
- The ket must encode BOTH the function AND the specific binding
- A **d-dimensional** representation (not d²) must somehow discriminate between:
  - `|do-something context=context-1⟩`
  - `|do-something context=context-2⟩`
  - `|do-something context=context-3⟩`
  - ...

In tensor space, these would be orthogonal d²-dimensional states. In d-dimensional space, they must somehow coexist while remaining distinguishable.

### How RNNs Solve This

**Sequential state compression**:
```python
h_t = f(h_{t-1}, x_t)

# context-1 arrives first
h_1 = f(h_0, context-1_emb)

# do-something arrives later  
h_2 = f(h_1, do-something_emb)
# h_2 now contains (context-1, do-something) information
```

Observations:
- Context is "folded into" hidden state h
- The state h remains **d-dimensional** (not d²)
- Context-1 and do-something are mixed through recurrence
- Which context is bound is encoded **implicitly** in the d-dim vector
- **Trade-off**: Long-range dependencies fade through repeated compression

### How Transformers Solve This

**Attention-based dynamic binding**:
```python
# Attention computes binding weights
α = softmax(Q @ K^T)  # which context to use

# Mix context embeddings
output = α @ V

# For "do-something context=context-1":
α[context-1] = high   # attention focuses here
α[context-2] = low    # ignores other contexts

# Result embedding (d-dimensional):
result ≈ do-something_emb + α[context-1] · context-1_emb
```

Observations:
- Attention computes α (binding strength) dynamically
- The output is a **d-dimensional mixture** of context embeddings
- α acts as the "selector" in d dimensions, not in d² tensor space
- **Key**: The scalar α replaces the tensor product dimension

### The Mathematical Bridge

**Tensor representation** (exact, expensive):
```
⟨result|context| = ⟨do-something| ⊗ ⟨context-1|
Dimensions: d²
Index: Explicit (which context is a dimension index)
```

**Matrix representation** (compressed, efficient):
```
result_emb = W @ (do-something_emb + α · context_emb)
Dimensions: d
Index: Implicit (which context is encoded in α coefficient)
```

The attention coefficient **α** does the work of the tensor product dimension—it selects which context basis state to use, but encodes this choice as a **scalar weight** instead of a **dimension index**.

### Why Both Models Work (Empirically)

**RNN**:
- Recurrent state h "remembers" context information
- Compression: (context, action) → d-dim h
- Context identity encoded in activation patterns
- How discrimination works: **Unknown** (likely depends on learned representations and recurrent dynamics)

**Transformer**:
- Attention explicitly computes context binding weights (α)
- Block-structured feed-forward applies operations (if learned)
- Context identity encoded in mixture coefficients
- How discrimination works: **Partially understood** (attention provides explicit binding, but how feed-forward extracts and operates on mixed states is still unclear)

### Open Questions

Both RNN and Transformer achieve the "impossible": represent d² tensor information in d dimensions. They do this through:

1. **Mixing/compression** instead of orthogonal basis states
2. **Implicit encoding** of context identity in d-dimensional vectors
3. **Learned representations** that somehow maintain discriminability

However, we don't fully understand:
- How exactly d-dimensional states maintain context discrimination without interference
- What structure in the learned embeddings enables this compression
- Whether there are theoretical limits to how many contexts can be distinguished
- What role non-linearity plays (is it essential, or just helpful?)

**Current understanding**: Attributing everything to "non-linearity enables discrimination" is hand-waving. We know empirically that RNNs and Transformers work, but the precise mechanism by which d-dimensional representations encode and discriminate between different context bindings remains an open question.

The block-structured matrix approach (previous section) provides one possible answer: if embeddings are structured with dimension separation, then linear operations might suffice. But whether real neural networks learn this structure, or use some other mechanism, is not yet clear.

### Implications

The shift from `|context-1⟩|do-something⟩` (tensor, sequential) to `|do-something context=context-1⟩` (parametric, named) represents a fundamental computational transition:

- **Symbolic systems** naturally use named parameters (efficient representation)
- **Tensor systems** naturally use sequential composition (expensive but exact)
- **Neural systems** (RNN, Transformer) somehow bridge these, achieving named-parameter semantics with sub-tensor-product dimensionality

Understanding this bridge more precisely could:
- Inform better architectures for symbolic-neural hybrid systems
- Explain why certain tasks are hard for current models (those requiring many orthogonal context bindings?)
- Guide design of structured embeddings that make discrimination explicit rather than implicit

---

## The Routing Problem: Can Linear Operations Route Based on Context?

**Working Notes - April 27, 2026**

### A Minimal Example

Let's test whether a linear matrix can route computation based on a context label.

**Setup** (3-dimensional system):
```
input = [opcode, arg1, arg2]

Examples:
x₁ = [1, 5, 3]  → opcode=1 (addition): want 5 + 3 = 8
x₂ = [2, 5, 3]  → opcode=2 (subtraction): want 5 - 3 = 2
```

The opcode (dimension 0) is the **context label** that should determine which operation is applied to arg1 and arg2.

### Can a 3×3 Matrix W Do This?

**Linear transformation**:
```
W @ x = [w₁₁·opcode + w₁₂·arg1 + w₁₃·arg2]
        [w₂₁·opcode + w₂₂·arg1 + w₂₃·arg2]
        [w₃₁·opcode + w₃₂·arg1 + w₃₃·arg2]
```

For the result (third component), we need:
```
result = w₃₁·opcode + w₃₂·arg1 + w₃₃·arg2
```

**Desired behavior**:
- When opcode=1: `result = arg1 + arg2 = 5 + 3 = 8`
- When opcode=2: `result = arg1 - arg2 = 5 - 3 = 2`

**Testing with our examples**:

Case 1 (addition, opcode=1):
```
w₃₁·1 + w₃₂·5 + w₃₃·3 = 8
→ w₃₁ + 5w₃₂ + 3w₃₃ = 8
```

Case 2 (subtraction, opcode=2):
```
w₃₁·2 + w₃₂·5 + w₃₃·3 = 2
→ 2w₃₁ + 5w₃₂ + 3w₃₃ = 2
```

Subtracting equations: `w₃₁ = -6`

Substituting back: `5w₃₂ + 3w₃₃ = 14`

Choose: `w₃₂ = 1, w₃₃ = 3` (since `5 + 9 = 14`)

**Testing the general formula**:
```
result = -6·opcode + 1·arg1 + 3·arg2
```

For addition (opcode=1):
```
result = -6(1) + arg1 + 3·arg2 = -6 + arg1 + 3·arg2
```

This is NOT `arg1 + arg2`! ❌

### The Fundamental Limitation

A linear transformation computes:
```
output_i = Σⱼ wᵢⱼ · xⱼ
```

This is a **fixed linear combination**. The weights wᵢⱼ are constants that cannot change based on input values.

**What we need**:
- Addition: coefficient of arg2 should be **+1**
- Subtraction: coefficient of arg2 should be **-1**

**What linear gives us**:
- Fixed coefficient w₃₃ for arg2 (same for all opcodes)

To make the coefficient on arg2 depend on opcode, we would need:
```
result = arg1 + f(opcode) · arg2
```

where `f(opcode)` changes sign. But this requires either:
1. **Non-linear function**: f is not linear
2. **Bilinear form**: opcode × arg2 interaction term
3. **Lookup mechanism**: different weights selected based on opcode

None of these are linear matrix operations!

### What Actually Works

**Option 1: Direct Sum with Dimension Separation** (NOT routing!)
```
# Add opcode-dependent bias
result = arg1 + arg2 + bias(opcode)

# With opcode=1: bias = 0 → result = arg1 + arg2
# With opcode=2: bias = -2·arg2 → result = arg1 + arg2 - 2·arg2 = arg1 - arg2
```

But this only works if you know the arguments in advance! Not general routing.

**Option 2: Multi-Layer with Non-Linearity** (How neural nets do it)
```python
# Layer 1: Detect opcode
h = ReLU(W₁ @ x)

# If opcode=1: neurons h[0..k] activate
# If opcode=2: neurons h[k..n] activate

# Layer 2: Different neurons → different computation paths
result = W₂ @ h

# Effective routing through sparse activations
```

The ReLU creates **sparse activation patterns** that route through different computational pathways.

**Option 3: Attention Mechanism** (Transformers)
```python
# Query based on opcode
Q = f(opcode_emb)

# Keys for different operations
K = [add_operation_emb, subtract_operation_emb, ...]

# Attention selects which operation
α = softmax(Q @ K^T)

# Value contains operation-specific weights
V = [weights_for_add, weights_for_subtract, ...]
operation_weights = α @ V  # dynamic weights!

# Apply dynamically selected weights
result = operation_weights @ [arg1, arg2]
```

Attention computes the mixing coefficient α **dynamically**, enabling context-dependent routing.

**Option 4: Bilinear/Tensor Layers**
```python
# Tensor contraction allows opcode × arg interaction
result = arg1 + T[opcode, :] @ arg2

# Where T is a learned tensor:
T[1, :] = [1]   # addition: coefficient +1
T[2, :] = [-1]  # subtraction: coefficient -1
```

This requires higher-order operations beyond simple matrix multiplication.

### The Core Insight

**A single linear matrix CANNOT do context-dependent routing.**

Linear operations can:
- ✓ Add context-dependent biases: `w₃₁·opcode` adds different constants
- ✓ Mix inputs: `w₃₂·arg1 + w₃₃·arg2` combines inputs
- ✓ Map to different regions: different inputs → different outputs

Linear operations CANNOT:
- ✗ Change which operation is applied to arguments
- ✗ Multiply inputs together conditionally  
- ✗ Implement if-then-else logic
- ✗ Select different coefficients based on context

### Why Neural Networks Need More Than Linear Layers

This simple 3D example reveals the fundamental requirement:

**Context-dependent routing requires one of**:
1. **Non-linearity** (ReLU, tanh, etc.) + multiple layers
2. **Attention mechanisms** (dynamic weight computation)
3. **Higher-order operations** (bilinear, tensor products)
4. **Structured representations** + careful initialization (might enable linear approximations)

The question "how do neural networks route based on context?" is really asking: **how do multiple linear layers + non-linearity + learned representations together implement routing behavior that no single linear layer can achieve?**

This remains an open question. We observe empirically that it works, but the precise mechanism—what structure emerges in the weights and embeddings, how information flows through layers, why certain architectures succeed where others fail—is not yet fully understood.

### Implications for Symbolic-Neural Hybrid Systems

For Dirac's goal of differentiable symbolic execution:

1. **Pure linear operations are insufficient** for general symbolic computation (which requires conditional logic, pattern matching, and routing)

2. **Attention mechanisms** might be necessary, not just useful—they provide the dynamic binding needed for context-dependent operations

3. **Block-structured matrices** (from previous sections) can help, but may require:
   - Careful embedding design
   - Multi-layer architectures
   - Non-linear activations for routing

4. **Alternative**: Design symbolic operations to be expressible as linear operations over carefully structured representations (limiting what's computable but enabling true differentiability)

The tension between "neural" (continuous, differentiable) and "symbolic" (discrete, conditional) computation is fundamentally about this routing problem: symbolic systems route via discrete pattern matching, while neural systems must achieve similar behavior through continuous operations.

---

## Resolution: How Attention Enables Routing Through Bilinear Operations

**Working Notes - April 27, 2026**

### The Breakthrough Insight

After extensive exploration, we've identified **why** Transformers (and gated RNNs) can handle context-dependent routing while pure feed-forward networks cannot:

**Attention mechanisms provide bilinear operations that enable multiplicative interaction between context and operands.**

### Three Approaches to Routing

#### Approach 1: Tensor Product with One-Hot Encoding ✓

**Representation**:
```
|opcode⟩ ⊗ |operand⟩
```

Using one-hot encoding for opcodes:
```
# Addition
[1, 0] ⊗ [arg1, arg2] = [arg1, arg2, 0, 0]

# Subtraction  
[0, 1] ⊗ [arg1, arg2] = [0, 0, arg1, arg2]
```

**Linear operator**:
```
W = [w₁, w₂, w₃, w₄]

Addition:    w₁·arg1 + w₂·arg2 + 0 + 0
Subtraction: 0 + 0 + w₃·arg1 + w₄·arg2
```

**Why it works**: Different opcodes populate **orthogonal dimensions**. The weight matrix can have different coefficients for each region:
- Set w₁=1, w₂=1 for addition (arg1 + arg2)
- Set w₃=1, w₄=-1 for subtraction (arg1 - arg2)

**Cost**: k opcodes × d operand dims = **k·d total dimensions**

**Verification with example**:
```
[1, 5, 7] → [1,0] ⊗ [5,7] = [5,7,0,0]
W @ [5,7,0,0] = 1·5 + 1·7 = 12 ✓

[2, 5, 7] → [0,1] ⊗ [5,7] = [0,0,5,7]  
W @ [0,0,5,7] = 1·5 + (-1)·7 = -2 ✓
```

**This works!** Tensor product with one-hot encoding enables linear routing at the cost of dimension expansion.

#### Approach 2: Concatenation + Pure Linear Layers ✗

**Representation**:
```
[opcode, arg1, arg2]  # Direct sum, 3 dimensions
```

**Linear operator**:
```
result = w₁·opcode + w₂·arg1 + w₃·arg2
```

**Why it fails**: For different opcodes to produce different operations on the arguments, we need the coefficients on arg1 and arg2 to **change** based on opcode. But in a linear system, coefficients are fixed!

We proved mathematically that no choice of w₁, w₂, w₃ can correctly compute:
- `arg1 + arg2` when opcode=1
- `arg1 - arg2` when opcode=2

for arbitrary arg1, arg2.

**Conclusion**: Pure concatenation + linear layers **cannot route**.

#### Approach 3: Attention (Bilinear Operations) ✓

**Representation**: Sequence of tokens
```
Token 0: |opcode⟩
Token 1: |arg1⟩  
Token 2: |arg2⟩
```

**Attention mechanism**:
```
Q = W_Q @ X  # Queries
K = W_K @ X  # Keys
V = W_V @ X  # Values

# Attention scores (THIS IS THE KEY!)
scores_ij = Q_i · K_j = (W_Q @ x_i)^T @ (W_K @ x_j)

# This is BILINEAR in x_i and x_j!

# Weighted output
output_i = Σ_j softmax(scores_i)_j × V_j
```

**Why it works**: The attention score `Q_i · K_j` computes a **multiplicative interaction** between tokens:

When token i is the opcode and token j is an operand:
```
score = Q_opcode · K_operand
      = (W_Q @ opcode_emb)^T @ (W_K @ operand_emb)
```

This score depends on **both** the opcode and the operand through their dot product—exactly the multiplication we need for routing!

**Concrete example**:

For **addition** (opcode=1):
```
Q_op=1 · K_arg2 = high score → high attention weight → include arg2
```

For **subtraction** (opcode=2):
```
Q_op=2 · K_arg2 = different score → different attention weight
```

The Values (V) can encode operation-specific transformations, and the attention weights (computed via Q·K) select which transformations to apply.

**Then feed-forward** just processes the result:
```
result = W_FF @ (attended_output)
```

The feed-forward layer doesn't need to route—that was already done by attention's bilinear Q·K interaction!

### The Mathematical Requirement

**Routing requires multiplicative interaction: context × data**

This can be achieved via:

1. **Tensor product** (Approach 1)
   - Explicit dimension separation
   - Cost: k·d dimensions
   - Exact routing possible

2. **Bilinear operations** (Approach 3)
   - Attention: Q·K dot product
   - Gating (LSTM/GRU): element-wise multiplication
   - Cost: Computation, not dimension
   - Exact routing possible

3. **Approximation** (deep networks + non-linearity)
   - Multiple layers with ReLU/tanh
   - Learns representations where routing "emerges"
   - Inexact, depends on training

### Why Different Architectures Work (or Don't)

**Vanilla RNN**:
```
h_t = tanh(W_hh @ h_{t-1} + W_xh @ x_t)
```
- No multiplication between h_{t-1} and x_t
- Relies on approximation through depth + tanh
- **Limited routing capability** (why LSTM was needed)

**LSTM/GRU**:
```
gate = σ(W @ [h_{t-1}, x_t])
output = gate ⊙ candidate  ← Element-wise multiplication!
```
- **Explicit gating** (multiplication) enables routing
- Gate can be context-dependent (different for different inputs)
- **Strong routing capability**

**Transformer**:
```
attention = softmax(Q @ K^T)  ← Bilinear!
output = attention @ V
```
- **Attention provides bilinear interaction**
- Q·K computes context-operand interactions
- **Strongest routing** (can attend to any token)

**Feed-Forward Networks**:
```
h = ReLU(W₁ @ x)
y = W₂ @ h
```
- No multiplicative interactions (even with multiple layers)
- Can approximate through learned representations
- **Limited routing** without many layers

### The Core Answer

**"Why can Transformers handle context-dependent routing?"**

Because the attention mechanism (`Q @ K^T`) is **bilinear**, providing the multiplicative interaction (context × data) needed for routing. The feed-forward layers then operate on the already-routed representation.

**"Why can't pure feed-forward networks route?"**

Because they consist only of linear operations (W @ x) and element-wise non-linearities (ReLU). They lack the bilinear term needed to make coefficients depend on context.

**"What about vanilla RNNs?"**

They also lack explicit multiplicative interactions and rely on approximation through sequential processing + tanh. This is why they struggle with complex routing tasks compared to LSTM/GRU (which have gating) or Transformers (which have attention).

### Implications for Differentiable Symbolic Execution

For implementing symbolic operations in neural architectures:

1. **Attention is necessary, not optional** for context-dependent operations like function calls, pattern matching, and conditional logic

2. **Tensor product representations** (with one-hot context encoding) could enable exact symbolic computation but at the cost of dimension explosion

3. **Hybrid approach**: Use attention for routing + structured embeddings (block matrices) for operations might be optimal

4. **Pure feed-forward networks are insufficient** for general symbolic computation without prohibitive depth/width

The routing problem is the fundamental bridge between symbolic (discrete, conditional) and neural (continuous, differentiable) computation. Attention mechanisms solve this by introducing bilinear operations that enable learned, differentiable routing.

### Connection to Bra-Ket Notation and Sandwiched Form

The bilinear form `⟨x|M|y⟩` is a well-established concept in quantum mechanics (bra-ket notation, introduced by Paul Dirac in the 1930s).

In this notation:
- `|y⟩` is a ket (state vector)
- `⟨x|` is a bra (dual vector)
- `M` is an operator
- `⟨x|M|y⟩ = x^T @ M @ y` is the bilinear form

**Attention scores are exactly this**:
```
score_ij = ⟨Q_i|K_j⟩           # Simple inner product
         = ⟨x_i|W_Q^T W_K|x_j⟩  # With learned operator M = W_Q^T W_K
         = ⟨x_i|M|x_j⟩
```

This connects to the **sandwiched notation** that can represent transformations:
```
output = Σ_i |o_i⟩⟨o_i|M|input⟩
```

Where:
- `|o_i⟩` are output basis states
- `⟨o_i|M|input⟩` is the bilinear coefficient (how much each output contributes)
- The sum creates a superposition weighted by these coefficients

**For our routing example**: If `input = |opcode⟩`, then:

```
result = Σ_i |result_i⟩⟨result_i|M|opcode⟩
```

When opcode = addition:
- `⟨add_result|M|opcode=1⟩` = high → addition result dominates
- `⟨sub_result|M|opcode=1⟩` = low → subtraction result suppressed

When opcode = subtraction:
- `⟨add_result|M|opcode=2⟩` = low
- `⟨sub_result|M|opcode=2⟩` = high → subtraction result dominates

**The same operator M**, acting on different inputs through the bilinear form, produces different outputs. This is precisely the routing mechanism!

**In attention**, this becomes:
```
output_i = Σ_j |V_j⟩ · softmax(⟨Q_i|M|K_j⟩)
```

Where `softmax(⟨Q_i|M|K_j⟩)` plays the role of the bilinear selector, determining which values to attend to based on the compatibility computed through M.

The routing mechanism was implicit in the bilinear form from the beginning—attention just makes it explicit and learnable through gradient descent.

---

## The Universal Approximation Paradox

**Working Notes - April 27, 2026**

### The Claim

The **Universal Approximation Theorem** states that a feed-forward neural network with:
- One hidden layer
- Sufficient width
- Non-linear activation (e.g., sigmoid, ReLU)

can approximate **any continuous function** to arbitrary precision.

### The Paradox

But we just proved that feed-forward networks **cannot** exactly compute our simple routing function (opcode + args → result)!

**How can both be true?**

### Resolution: "Approximate" vs "Exact"

**Universal Approximation says**: For any ε > 0, there exists a network that gets within ε of the target function.

**Our proof says**: No finite network can compute the function **exactly** for all inputs.

These are compatible! Here's why:

#### What "Approximation" Means

Consider our opcode example with continuous inputs:
```
f(1, x, y) = x + y     # addition
f(2, x, y) = x - y     # subtraction
```

A feed-forward network can learn:
```
f_approx(op, x, y) ≈ (2 - op)·(x + y) + (op - 1)·(x - y)
                    = (2 - op)·x + (2 - op)·y + (op - 1)·x - (op - 1)·y
                    = [2 - op + op - 1]·x + [2 - op - op + 1]·y
                    = x + (3 - 2·op)·y
```

When op = 1: `x + (3 - 2)·y = x + y` ✓
When op = 2: `x + (3 - 4)·y = x - y` ✓

**Wait, this works exactly!** So what's going on?

The trick is the coefficient `(3 - 2·op)` requires **multiplying** op by y. A single linear layer can't do this, but we can approximate it:

```
# Hidden layer with many neurons
h = ReLU(W @ [op, x, y])

# Some neurons might learn:
h[i] ≈ max(0, a·op + b·y)  for various a, b

# Output layer combines:
result ≈ Σ w_i·h[i]
```

With enough neurons, this can approximate `op × y` arbitrarily closely in a bounded region.

#### The Limitations

**1. Approximation is local, not global**:
- Universal approximation works on **compact sets** (bounded regions)
- For unbounded inputs, no guarantee

**2. Width grows with precision**:
- To get error < ε, you might need O(1/ε^d) neurons (curse of dimensionality)
- For our 3D problem with ε = 0.001, might need thousands of neurons

**3. Approximation is not composition**:
- Approximating f and g doesn't mean approximating f∘g
- Error compounds through layers

**4. Learning is not guaranteed**:
- Theorem says a solution exists
- Doesn't say gradient descent will find it

#### Why Our Example is "Hard"

Our routing function has a **discontinuity** at the opcode boundary:
```
f(1.0, 5, 3) = 8
f(1.5, 5, 3) = ??? (undefined in our discrete setting)
f(2.0, 5, 3) = 2
```

If we make it continuous by interpolating:
```
f(op, x, y) = (2 - op)·(x + y) + (op - 1)·(x - y)  for op ∈ [1, 2]
```

Then a network CAN learn it! But this requires:
- Neurons that detect "op near 1" vs "op near 2"
- Combining their outputs with appropriate weights
- Many neurons to get sharp boundaries

**The universal approximation theorem guarantees this is possible**, but:
- Requires careful architecture
- May need many neurons
- May be hard to train
- Exact computation still requires the bilinear term

### Why Attention/Gating Work Better

**Attention and gating don't approximate—they compute exactly**:

```
# Attention (exact bilinear):
score = Q · K  (exact dot product)

# Gating (exact multiplication):
output = gate ⊙ candidate  (exact element-wise product)
```

These architectures have the **right inductive bias** for routing:
- Built-in multiplicative interactions
- Sparse, interpretable routing
- Generalizes to unseen combinations

**Feed-forward can approximate**, but requires:
- Many more parameters
- Careful training
- Less interpretable
- No guarantee of generalization

### The Bottom Line

**Universal Approximation Theorem**: True, but...
- "Approximate" ≠ "exact"
- Requires sufficient width (possibly very large)
- Only on compact sets
- No guarantee of learnability

**Our routing impossibility**: Also true because...
- We proved no finite **exact** solution exists
- For unbounded inputs
- With purely linear operations

Both are correct! The theorem says you can get arbitrarily close; we showed you can't be exact without multiplicative interactions. For practical symbolic computation, "arbitrarily close" isn't enough—we need exact routing, which requires attention or gating.

---

## Attention as Unified Bind-Route-Compute Mechanism

**Working Notes - April 27, 2026**

### Evolution of Understanding

Through our investigation of the routing problem, we've arrived at a deeper understanding of what attention actually does.

**Initial hypothesis**: Attention = parameter binding (separate from computation)
- Attention binds: `|kick⟩ + |ball⟩ → |kick ball⟩`
- Feed-forward computes: `|kick ball⟩ → |ball-kicked⟩`

**Revised understanding**: Attention = unified bind-route-compute mechanism
- Attention does it all through bilinear interaction `⟨Q|M|K⟩`
- Feed-forward refines the representation

### The Dual Nature of Attention

Attention performs **both** binding AND computation simultaneously:

#### Example 1: Parameter Binding (Symbolic)
```
Input:  |kick⟩, |ball⟩  (two separate tokens)
        ↓ (attention)
Output: |kick ball⟩     (unified parameterized call)

Mechanism:
α_kick = softmax(⟨Q_kick|M|K_kick⟩)  # self-attention weight
α_ball = softmax(⟨Q_kick|M|K_ball⟩)  # cross-attention weight

|kick ball⟩ = α_kick·|V_kick⟩ + α_ball·|V_ball⟩
```

The bilinear term determines **which tokens should be bound together**.

#### Example 2: Routing/Computation (Arithmetic)
```
Input:  |add⟩, |1⟩, |2⟩  (three separate tokens)
        ↓ (attention)
Output: |3⟩              (computed result!)

Mechanism:
α_add = softmax(⟨Q_result|M|K_add⟩)   # high if operation is addition
α_1 = softmax(⟨Q_result|M|K_1⟩)       # weight for first operand
α_2 = softmax(⟨Q_result|M|K_2⟩)       # weight for second operand

|result⟩ = α_add·|V_add⟩ + α_1·|V_1⟩ + α_2·|V_2⟩
```

The bilinear term `⟨Q|M|K_add⟩` **routes based on opcode** (add vs subtract), and the weighted combination **computes the result**.

### The Unified Formula

```
output_i = Σ_j softmax(⟨Q_i|M|K_j⟩) · |V_j⟩
```

This single formula simultaneously:

1. **Binds parameters**: Attention weights select which tokens to combine
   - High weight between related tokens (function + argument)
   - Creates mixed states representing parameterized calls

2. **Routes computation**: Bilinear score `⟨Q|M|K⟩` depends on context
   - Different opcodes → different Q embeddings
   - Same operands → same K embeddings
   - Q·K interaction determines operation type

3. **Performs computation**: Weighted sum produces the result
   - Values (V) encode semantic content or operations
   - Attention weights determine how to combine them
   - Result represents the computed output

### Why This Works

The bilinear interaction `⟨Q_i|M|K_j⟩ = Q_i^T @ M @ K_j` provides the **multiplicative term** needed for routing:

```
score = Σ_a Σ_b Q_i[a] · M[a,b] · K_j[b]
```

Every component of Q_i interacts with every component of K_j through learned weights M[a,b].

For routing:
- Q captures "what I need" (context/opcode)
- K captures "what I offer" (operands/arguments)
- M learns "which needs match which offers"
- The product Q·M·K computes compatibility

This is exactly the `⟨opcode|M|operand⟩` bilinear form we identified as necessary for routing!

### Implications for Feed-Forward Layer

Given that attention already performs computation, what does feed-forward do?

**Revised role of feed-forward**:
1. **Representation transformation**: Projects attended output to desired space
2. **Non-linear refinement**: Adds expressivity through ReLU/GELU
3. **Position-wise processing**: Applies same transformation at each position
4. **Vocabulary projection**: Maps to output tokens (in final layer)

**Not**: Primary computation (that happened in attention via bilinear routing)

### The Sandwiched Form Connection

This connects back to the bra-ket sandwiched notation:

```
output = Σ_i |o_i⟩⟨o_i|M|input⟩
```

In attention:
```
output = Σ_j |V_j⟩ · softmax(⟨Q|M|K_j⟩)
       = Σ_j |V_j⟩⟨V_j|M_attention|input⟩
```

The bilinear coefficient `⟨V_j|M|input⟩` determines:
- Which values to include (binding)
- How much to weight them (routing)
- What the result represents (computation)

**All through the same mechanism!**

### Why Transformers Are So Powerful

A single attention layer performs:
1. ✓ Dynamic parameter binding (function + arguments)
2. ✓ Context-dependent routing (which operation?)
3. ✓ Actual computation (via bilinear interaction)
4. ✓ All in one differentiable operation

This is far more powerful than our initial "binding then execution" model suggested. Attention isn't preparatory work for the real computation—**it IS the computation**, through the bilinear form that enables context-dependent operations.

### Open Questions

This understanding raises new questions:
- What exactly do feed-forward layers learn if attention does the computation?
- Can we design attention mechanisms specifically optimized for symbolic operations?
- Should we initialize M to have structure (block diagonal, sparse, etc.)?
- How many attention heads are needed for different types of routing?

These warrant further investigation.

---

## Alternative: Layer-Based Tensor Routing (Biological Perspective)

**Working Notes - April 27, 2026**

### The Question

We've shown that attention enables routing through bilinear operations (Q·K). But transformers use **all-to-all connectivity within a layer**. The biological brain has a very different architecture: **hierarchical layers with sparse, structured connections**.

Could the brain achieve the same routing function using a **layer-to-layer tensor product** approach instead of attention?

### Biological Cortical Architecture

In the neocortex, information flows through distinct layers:

```
Layer 4 (input from thalamus)
   ↓
Layer 2/3 (integration, recurrent processing)
   ↓ ↑ (feedback)
Layer 5 (output to other brain regions)
   ↓
Layer 6 (feedback to thalamus)
```

With both **feedforward** (bottom-up) and **feedback** (top-down) connections.

### Proposal: Context Layer Drives Operand Layer

Instead of attention computing within one layer, consider:

**Layer 1** (Context/Opcode):
```
L1 = [n_add, n_subtract, n_multiply, ...]
```
Sparse activation (quasi-one-hot): Only one operation type active at a time.

**Layer 2** (Operands/Data):
```
L2 = [arg1_neurons, arg2_neurons, ...]
```
Represents the data to operate on.

**Layer 3** (Result) receives tensor product:
```
L3 = W @ (L1 ⊗ L2)
```

The tensor product L1 ⊗ L2 creates **all combinations** of context × data.

### Mathematical Equivalence

**Recall our tensor product solution** (from earlier):

With one-hot opcode encoding:
```
Addition:    [1, 0] ⊗ [arg1, arg2] = [arg1, arg2, 0, 0]
Subtraction: [0, 1] ⊗ [arg1, arg2] = [0, 0, arg1, arg2]

W = [w₁, w₂, w₃, w₄] can route:
  w₁·arg1 + w₂·arg2  (addition pathway)
  w₃·arg1 + w₄·arg2  (subtraction pathway)
```

**In layered architecture**:
```
L1 = [a_add, a_sub]  # activation levels (quasi-one-hot)
L2 = [a_arg1, a_arg2]

L1 ⊗ L2 = [a_add·a_arg1, a_add·a_arg2, a_sub·a_arg1, a_sub·a_arg2]

L3 = W @ (L1 ⊗ L2)
   = [w₁, w₂, w₃, w₄] @ [a_add·a_arg1, a_add·a_arg2, 
                          a_sub·a_arg1, a_sub·a_arg2]
```

The **multiplication** (a_add · a_arg1) creates the routing!

### How Neurons Could Implement Multiplication

#### Mechanism 1: Dendritic Computation

Modern neuroscience shows dendrites are **not passive**:

```
Neuron in L3 has two dendritic branches:
  Branch A: receives from L1[i] (opcode neuron)
  Branch B: receives from L2[j] (operand neuron)

Local computation in dendrite:
  branch_output = activity_A × activity_B  ← Multiplication!

At soma:
  neuron_output = Σ_branches branch_output
                = Σ_ij (L1[i] × L2[j] × w_ij)
```

**Evidence**:
- NMDA receptors require **both** presynaptic glutamate AND postsynaptic depolarization
- This creates multiplicative gating: output ∝ (input₁ × input₂)
- Different dendritic branches compute independently
- Soma integrates (sums) branch outputs

**This is exactly tensor product computation!**

#### Mechanism 2: Conjunction Neurons (Population Coding)

```
L3 has dedicated neurons for each (opcode, operand) combination:

L3_neuron[0]: fires for (add, arg1)
L3_neuron[1]: fires for (add, arg2)  
L3_neuron[2]: fires for (subtract, arg1)
L3_neuron[3]: fires for (subtract, arg2)
```

Each L3 neuron acts as an **AND gate**: fires only when both L1[i] AND L2[j] are active.

**Advantages**:
- Biologically plausible (neurons as feature detectors)
- Brain has ~86 billion neurons (sufficient for many conjunctions)
- Observed in visual cortex (complex cells detect combinations)

**Implementation**:
- Require high synaptic input from both L1[i] AND L2[j] to reach threshold
- Acts like: `activity = (L1[i] AND L2[j]) ? 1 : 0`
- Approximately: `activity ≈ min(L1[i], L2[j])` or `L1[i] × L2[j]` if normalized

#### Mechanism 3: Gain Modulation

```
L1 (context) doesn't directly activate L3
Instead, L1 modulates the GAIN of L2 → L3 connections

When L1[add] is active:
  Amplify synaptic weights for "addition-compatible" L2 → L3 connections
  
When L1[subtract] is active:
  Amplify synaptic weights for "subtraction-compatible" L2 → L3 connections
```

Mathematically:
```
L3[k] = Σ_j (gain_from_L1 × L2[j] × w_jk)
      = (modulation_signal) × (feedforward_input)  ← Multiplication!
```

**Evidence**:
- Neuromodulators (dopamine, acetylcholine) modulate synaptic gain
- Attention (psychological) modulates sensory processing gain
- Top-down signals from prefrontal cortex amplify/suppress responses
- This is exactly multiplicative gain control

### Comparison: Attention vs Layer-Based Tensor

**Transformer Attention**:
```
output = Σ_j softmax(Q·K_j) × V_j

Properties:
- All within one layer
- All-to-all connectivity (N² connections)
- Parallel computation
- Explicit softmax normalization
```

**Layer-Based Tensor**:
```
output = W @ (L1 ⊗ L2)
       = Σ_i Σ_j (L1[i] × L2[j] × W[i,j])

Properties:
- Across layers (feedforward + feedback)
- Structured connectivity (sparse)
- Sequential processing (layer by layer)
- Implicit normalization (through neural dynamics)
```

**Same function, different implementation!**

Both compute context × data to achieve routing.

### Biological Plausibility

**Advantages of layer-based tensor approach**:

1. ✓ **Matches cortical architecture**: Brain has layers, not flat networks
2. ✓ **Sparse connectivity**: Don't need all-to-all connections (scales better)
3. ✓ **Local multiplication**: Dendritic computation or gain modulation
4. ✓ **Structured representations**: Populations encode one-hot-like categories
5. ✓ **Hierarchical processing**: Matches feedforward + feedback anatomy

**Challenges**:

1. ? **Dimension explosion**: k opcodes × d operands = k·d intermediate neurons
   - But brain has billions of neurons, so feasible!
2. ? **Learning without backprop**: How to adjust W without global error signals?
   - Possible through local learning rules (Hebbian, predictive coding)
3. ? **Timing precision**: Multiplication requires synchronous inputs
   - Brain uses oscillations (gamma, theta) for synchronization

### Testable Predictions

If the brain uses layer-based tensor routing, we'd expect:

1. **Sparse, structured activity** in "context" layers (L2/3)
   - Quasi-one-hot encoding of task/context
   - Only a few neurons active at once

2. **Conjunction coding** in output layers (L5)
   - Neurons respond to specific (context, stimulus) combinations
   - E.g., "respond to red color only during attention task"

3. **Dendritic computation** implements multiplication
   - Different branches respond to different input combinations
   - Branch outputs combined non-linearly at soma

4. **Gain modulation** from feedback connections
   - Top-down signals amplify/suppress bottom-up inputs
   - Multiplicative effect on firing rates

5. **Impaired routing** when layer connectivity disrupted
   - Optogenetic silencing of L2/3 should impair context-dependent tasks
   - But spare context-independent processing

**These are empirically testable with modern neuroscience techniques!**

### Implications for Artificial Networks

Could we build **layer-based tensor networks** as an alternative to transformers?

**Potential advantages**:
- More biologically plausible architecture
- Sparse connectivity (lower memory/compute)
- Structured inductive bias (explicit context × data separation)
- Easier interpretability (dedicated neurons for conjunctions)

**Potential disadvantages**:
- Dimension explosion for many contexts
- Requires quasi-one-hot context representations
- May be harder to train (less smooth optimization landscape)

**Worth exploring**: Hybrid architectures that combine:
- Attention for long-range dependencies
- Layer-based tensor for structured routing
- Sparse connectivity for efficiency

### The Deep Insight

**The brain might achieve attention-like routing through layer-based tensor products rather than explicit Q·K computation.**

The **computational principle** is the same:
- Context (opcode) × Data (operand) → Result
- Bilinear interaction for routing
- Enables context-dependent computation

The **implementation** differs:
- **Transformers**: Attention within layer (all-to-all, Q·K·V)
- **Brain**: Tensor across layers (sparse, feedforward + feedback, dendritic multiplication)

**Both solve the same problem** (routing), but in ways suited to their constraints:
- Transformers: Optimized for parallel computation on GPUs
- Brain: Optimized for sparse, local computation with billions of neurons

This suggests that **routing through multiplicative interaction** is a fundamental computational requirement, not specific to any architecture. Evolution and engineering have discovered different implementations of the same principle.

---

**End of document**

*These are working notes exploring the connection between attention mechanisms and symbolic parameter binding. Our understanding continues to evolve through investigation. The current view (April 27, 2026) is that attention performs unified bind-route-compute through bilinear operations, with feed-forward providing representation refinement. An alternative biological perspective suggests layer-based tensor products might achieve the same function through different neural mechanisms.*
