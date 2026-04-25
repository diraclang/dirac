# Attention as Argumented Ket: Understanding Parameter Binding in Transformers

**Working Notes - April 25, 2026**

## Core Insight

The transformer architecture can be reinterpreted through the lens of symbolic computation:
- **Attention layer** = Parameter binding mechanism (creating parameterized function calls)
- **Feed-forward layer** = Operator application (executing the function)

This provides a deeper understanding of why transformers need both components and why they appear in this specific order.

---

## The Two-Stage Model

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

**End of document**

*These are working notes exploring the connection between attention mechanisms and symbolic parameter binding. Ideas here may inform future revisions of the main paper or spawn separate research directions.*
