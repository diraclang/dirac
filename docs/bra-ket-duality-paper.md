# Bra-Ket Duality: Unifying Symbolic and Neural Computation Through Dirac Notation

**Zhi Wang, Thomas Wang**

*Diraclang*

**Abstract**

We demonstrate that symbolic computation (function invocation, pattern matching) and neural computation (transformer attention, vector operations) are not merely analogous but mathematically identical under bra-ket notation from quantum mechanics. The key insight is that both paradigms perform inner product operations to determine computational actions: symbolic systems use discrete metrics (exact name matching), while neural systems use continuous metrics (cosine similarity). We prove that symbolic tag-checking is equivalent to a single-layer neural network in the limit of zero temperature, and show that transformer attention is literally a bra-ket operator with the sandwich structure $M_1 |o\rangle\langle o| M_2 |x\rangle$, where $|o\rangle\langle o|$ represents self-projection over context tokens. A key contribution is identifying that parameters in symbolic expressions (e.g., $|\text{action param=value}\rangle$) correspond to context mixing through vector addition in neural networks—the continuous analog of discrete parameter binding. This unification explains why large language models can successfully perform tool-calling and symbolic reasoning: they implement differentiable versions of traditional symbolic dispatch mechanisms. We introduce DIRAC, a practical programming language that seamlessly integrates both computational paradigms, demonstrating that the theoretical unification has concrete engineering applications. Our work provides a mathematical foundation for hybrid symbolic-neural architectures and addresses critiques about the limitations of pure neural approaches by showing how system-level intelligence emerges from their composition.

**Keywords:** bra-ket notation, symbolic computation, neural networks, transformer attention, quantum mechanics, unified computing paradigm

---

## 1. Introduction: A Simple Example

### 1.1 The Aristotle Syllogism

Let's start with the most famous example in logic:

> **All humans are mortal**  
> **Socrates is human**  
> **Therefore, Socrates is mortal**

How would you implement this reasoning in code?

**Traditional approach (symbolic):**
```python
# Define facts as chained rules
rules = {
    'human': 'mortal',
    'Socrates': 'human'
}

# Chain lookup through rules
def what_is(entity):
    if entity in rules:
        return what_is(rules[entity])  # Recursive chain
    return entity

# Chains: Socrates → human → mortal
print(what_is('Socrates'))  # Output: mortal
```

This recursively follows the chain: "Socrates" → "human" → "mortal", stopping when no more rules apply. It works through exact dictionary lookup.

**Neural network approach:**
Train a model on examples like "Socrates → mortal", "Plato → mortal", etc. The network learns associations through continuous vector representations.

**Our insight:** These are the same operation, just with different "similarity metrics"!

### 1.2 The Bra-Ket Formulation

In quantum mechanics notation (bra-ket), we can write:

**Symbolic version:**
- "All humans are mortal" = $|\text{mortal}\rangle\langle\text{human}|$ (an operator)
- "Socrates is human" = $|\text{human}\rangle\langle\text{Socrates}|$ (another operator)

Chain them together:
$$|\text{mortal}\rangle\langle\text{human}| \cdot |\text{human}\rangle\langle\text{Socrates}| \cdot |\text{Socrates}\rangle \tag{1.1}$$

The middle parts cancel (like "human" appears in both bra and ket):
$$|\text{mortal}\rangle \underbrace{\langle\text{human}|\text{human}\rangle}_{=1} \langle\text{Socrates}|\text{Socrates}\rangle = |\text{mortal}\rangle \tag{1.2}$$

**Neural version:**
Same mathematical structure, but now consider learned embeddings $|\text{human}_{\text{emb}}\rangle$ and $|\text{Socrates}_{\text{emb}}\rangle$. The inner product $\langle\text{human}_{\text{emb}}|\text{Socrates}_{\text{emb}}\rangle$ might be 0.85 (high similarity, since Socrates is human) rather than exact 1. The network computes:
$$|\text{mortal}\rangle\langle\text{human}_{\text{emb}}| \cdot |\text{human}_{\text{emb}}\rangle\langle\text{Socrates}_{\text{emb}}| \cdot |\text{Socrates}_{\text{emb}}\rangle \tag{1.3}$$

where each inner product is a **similarity score** instead of exact match.

### 1.3 Why This Matters

This simple example reveals something profound:

**Symbolic reasoning** = Function lookup with exact matching  
**Neural reasoning** = Function lookup with similarity matching  
**Same mathematical structure!**

The bra-ket notation makes this visible. Both systems:
1. Have "operators" (functions/rules) of the form $|\text{output}\rangle\langle\text{input}|$
2. Use inner products $\langle\text{pattern}|\text{query}\rangle$ to check matches
3. Chain operators to perform multi-step reasoning

The only difference:
- **Symbolic:** $\langle\text{pattern}|\text{query}\rangle \in \{0, 1\}$ (discrete, exact)
- **Neural:** $\langle\text{pattern}|\text{query}\rangle \in [0, 1]$ (continuous, fuzzy)

This explains why LLMs can do function calling and tool use—they're implementing differentiable versions of symbolic dispatch!

### 1.4 The Broader Context

For decades, AI research has oscillated between two paradigms:

**Symbolic AI** (dominant 1950s-1980s, resurgent in modern tool-use): Logic-based reasoning, explicit rules, theorem proving—interpretable but brittle

**Neural AI** (explored since 1940s, dominant 1990s-present): Learned representations, gradient descent, continuous optimization—flexible but opaque

These approaches have always coexisted, with one dominating mainstream research while the other survived on the fringe. The perceptron (1958) and early neural networks existed during symbolic AI's "golden age," just as expert systems and logic programming continued during the neural network revival (sparked by backpropagation's popularization in 1986).

The rise of large language models raises a deeper question: LLMs perform tasks like tool-calling and multi-step reasoning despite being "merely" neural networks trained on text. While most researchers distinguish this from traditional symbolic AI (knowledge graphs, frames, formal logic), examining the mathematical structure reveals something surprising. **Both symbolic knowledge representation and neural networks share the same underlying structure—tensor operations that can be expressed as bra-ket inner products.**

Our thesis: **Knowledge representation (whether symbolic or neural), function dispatch, and attention mechanisms all use the same mathematical operation**—inner products to match patterns and select/combine results. The traditional "symbolic vs. neural" divide is really about discrete vs. continuous similarity metrics, not fundamentally different computation.

### 1.5 The Bra-Ket Insight

Our central thesis: **Symbolic and neural computation share the same mathematical structure—bra-ket inner products from quantum mechanics.**

In quantum mechanics, bra-ket notation provides an elegant way to express:
- States as vectors: $|ψ\rangle$ (ket)
- Dual vectors: $\langle φ|$ (bra)
- Inner products: $\langle φ | ψ \rangle$ (projection/measurement)
- Operators: $|ψ\rangle\langle φ|$ (outer product)

We show that:
- **Symbolic function lookup** = $\langle \text{def} | \text{call} \rangle$ with discrete metric
- **Neural attention** = $\sum_i |v_i\rangle \langle k_i | q_j \rangle$ with continuous metric
- **Both are inner products** differing only in metric space and selection mechanism

This is not metaphor—it's mathematical identity.

### 1.6 A Concrete Example: Function Calls

Let's see this with something familiar—calling a function:

**Symbolic (Python):**
```python
def greet(name):
    return f"Hello, {name}!"

result = greet("Alice")  # Output: "Hello, Alice!"
```

**Bra-ket form:**
- Pattern (bra): $\langle\text{greet name}|$ matches calls to "greet" with any name parameter
- Action (ket): output template that produces "Hello, [name]"
- Function call: $|\text{greet Alice}\rangle$
- Matching: 
$$\langle\text{greet name}|\text{greet Alice}\rangle = 1 \text{ (exact match with binding: name} \mapsto \text{Alice)} \tag{1.4}$$
- Result: "Hello, Alice!" (text output from template)

**Neural (Transformer Attention):**

Imagine the model has seen training examples:
- "greet Alice" → "Hello, Alice!"
- "greet Bob" → "Hello, Bob!"

When given input "greet Carol", the attention mechanism:
1. Computes similarity: query "greet Carol" vs keys ["greet Alice", "greet Bob"]
2. Gets high scores (cosine similarity ≈ 0.9 for both)
3. Returns weighted average of values ["Hello, Alice!", "Hello, Bob!"]
4. Produces "Hello, Carol!"

**Same structure:** 
$$\sum_i |\text{value}_i\rangle \langle\text{key}_i|\text{query}\rangle \tag{1.5}$$

The transformer is doing **soft function dispatch**—looking up similar patterns instead of exact matches!

### 1.7 Side-by-Side Comparison

Here's the key insight in table form:

| Aspect | Symbolic (Python) | Neural (Transformer) | Bra-Ket Form |
|--------|------------------|---------------------|--------------|
| **Data** | Function name: "greet" | Word embedding: [0.2, -0.5, ...] | Vector $\|\text{greet}\rangle$ |
| **Match** | Exact string comparison | Cosine similarity | Inner product $\langle \text{key}\|\text{query}\rangle$ |
| **Result** | 0 or 1 (binary) | 0.0 to 1.0 (continuous) | Real number |
| **Selection** | Single match wins | Weighted average of all | $\sum_i \text{weight}_i \cdot \text{value}_i$ |
| **Operator** | Function definition | Attention weights | $\|\text{value}\rangle\langle \text{key}\|$ |

**The punchline:** Both columns use the same mathematical operation—bra-ket inner products—just with different metrics!

**This explains:**
- Why LLMs can call functions and use tools (soft dispatch)
- Why fine-tuning works (adjusting similarity metrics)  
- Why prompting works (changing query vectors)
- Why retrieval-augmented generation works (adding more key-value pairs)

### 1.8 Why This Matters

Understanding this equivalence has profound implications:

1. **Theoretical:** Symbolic AI is a special case of neural networks (discrete limit)
2. **Practical:** Hybrid systems can seamlessly compose both paradigms
3. **Engineering:** We can design languages that unify symbolic and neural operations
4. **Explanatory:** This is why LLMs can use tools—they're doing differentiable function lookup!

### 1.8 Contributions

This paper makes the following contributions:

1. **Intuitive examples:** Step-by-step walkthrough of Aristotle's syllogism and function calls showing identical mathematical structure in symbolic and neural systems

2. **Mathematical unification:** Formal proof that symbolic tag-checking equals a single-layer neural network with discrete metric (Theorem 1)

3. **Compact attention notation:** Derivation showing transformer attention has sandwich structure $M_1 |o\rangle\langle o| M_2 |x\rangle$ where self-projection $|o\rangle\langle o|$ acts as "memory"

4. **Practical demonstration:** DIRAC programming language implementing symbolic-neural integration with bra-ket syntax

5. **Architectural framework:** Guidelines for building hybrid systems that preserve differentiability while enabling symbolic control

### 1.9 Paper Organization

We structure this paper to build from concrete examples to formal theory:

- **Section 1 (This section):** Simple examples showing the core insight—Aristotle's syllogism and function calls in both symbolic and neural forms

- **Section 2:** Symbolic computation formalized—how function calls, pattern matching, and composition work in bra-ket form

- **Section 3:** Neural computation formalized—deriving the compact sandwich form $M_1 |o\rangle\langle o| M_2 |x\rangle$ for transformer attention

- **Section 4:** Core equivalence theorem—proof that symbolic = discrete limit of neural, with duality table

- **Section 5:** DIRAC language—practical demonstration of symbolic-neural integration

- **Section 6:** Related work—positioning relative to symbolic AI, neural networks, and hybrid systems

- **Section 7:** Discussion and future directions—implications, limitations, and open questions

- **Appendix A:** Mathematical preliminaries on bra-ket notation for readers unfamiliar with quantum mechanics formalism

**Reading guide:** If you want intuition, read Sections 1, 2, 3, and 5. If you want formal proofs, focus on Sections 3, 4, and Appendix A.

---

## 2. Symbolic Computation as Bra-Ket Operations

For readers unfamiliar with bra-ket notation, see Appendix A for mathematical background. Here we use it intuitively: $|x\rangle$ is a vector (ket), $\langle y|$ is a dual vector (bra), and $\langle y|x\rangle$ is their inner product (a number measuring similarity).

### 2.1 Function Invocation as Inner Product

Consider a function definition:
```
def greet(name):
    return f"Hello, {name}!"
```

In traditional notation:
- **Definition signature:** `greet(name)` — the pattern to match
- **Function body:** `f"Hello, {name}!"` — the action to perform
- **Function call:** `greet("Alice")` — the invocation

**Bra-ket formulation:**

Define:
- $|\text{action}\rangle$ = function body (what to execute)
- $\langle\text{pattern}|$ = function signature (what to match)
- $|\text{call}\rangle$ = invocation (input)

The function lookup process:
$$\text{match} = \langle\text{pattern}|\text{call}\rangle \tag{2.1}$$

If match succeeds (equals 1 in discrete metric):
$$\text{result} = |\text{action}\rangle \tag{2.2}$$

**Example:** For calling `greet` with "Alice":
- $|\text{call}\rangle = |\text{greet Alice}\rangle$
- $\langle\text{pattern}| = \langle\text{greet name}|$
- $\langle\text{pattern}|\text{call}\rangle = 1$ (exact match on function name, binding: name $\mapsto$ Alice)
- Execute $|\text{action}\rangle$ (output template) → returns: "Hello, Alice!" (text output)

### 3.2 Multiple Function Dispatch

With multiple function definitions:

$$\text{output} = \sum_i |\text{action}_i\rangle \cdot \theta(\langle\text{pattern}_i|\text{call}\rangle - 1) \tag{2.3}$$

where $\theta(x)$ is the Heaviside step function: $\theta(x) = 1$ if $x \geq 0$, else $0$.

**Important:** In real symbolic systems, at most **one** pattern matches exactly, so only one term in the sum is non-zero:
- Each $\langle\text{pattern}_i|\text{call}\rangle$ checks one function signature
- For exact matching (discrete metric), $\langle\text{pattern}_i|\text{call}\rangle \in \{0, 1\}$
- Typically only one $i$ has $\langle\text{pattern}_i|\text{call}\rangle = 1$, others are 0
- The sum notation represents "check all definitions, return the one that matches"
- If multiple patterns match, this indicates ambiguity (usually an error in symbolic systems)

The summation form in equation (2.3) is written to **parallel the neural case** (equation 4.2), where multiple patterns can have non-zero similarity scores and contribute to a weighted output. In symbolic AI, the sum degenerates to a single term.

**Discrete metric:** The inner product $\langle\text{pattern}|\text{call}\rangle$ uses discrete matching:
- $1$ if names and argument types match exactly
- $0$ otherwise

### 3.3 Pattern Matching with Parameters

In DIRAC/DISH, a single pattern can match multiple inputs by binding parameters:

**DIRAC definition:**
```
<greet time|
  |output> Good |variable name=time>
```

**Bra-ket representation:**
- $\langle\text{pattern}| = \langle\text{greet time}|$ (matches any call to "greet" with a time parameter)
- $|\text{action}\rangle$ = template that outputs "Good [time]"

For input $|\text{greet morning}\rangle$:
$$\langle\text{greet time}|\text{greet morning}\rangle = 1 \quad \text{with binding: time} \mapsto \text{"morning"} \tag{2.4}$$

Returns: "Good morning" (text output, not a ket)

For input $|\text{greet evening}\rangle$:
$$\langle\text{greet time}|\text{greet evening}\rangle = 1 \quad \text{with binding: time} \mapsto \text{"evening"} \tag{2.5}$$

Returns: "Good evening" (text output, not a ket)

The pattern $\langle\text{greet time}|$ matches any call of the form $|\text{greet X}\rangle$, binding the parameter to create the appropriate output. The `|output>` action produces final text, not another ket for further processing.

### 3.4 Chaining Subroutine Calls

When a subroutine's body contains another ket (not `|output>`), it chains to call that subroutine. This naturally arises from the bra-ket operator structure.

**Example:** The Aristotle syllogism from Section 1:

```
<Socrates|
  |human>

<human|
  |mortal>

<mortal|
  |output> All things must end.
```

Calling $|\text{Socrates}\rangle$ triggers a chain:

$$|\text{mortal}\rangle\langle\text{human}| \cdot |\text{human}\rangle\langle\text{Socrates}| \cdot |\text{Socrates}\rangle \tag{2.6}$$

**Step-by-step execution:**
1. $\langle\text{Socrates}|\text{Socrates}\rangle = 1$ → pattern matches
2. Execute body: $|\text{human}\rangle$ (another ket, so continue chaining)
3. $\langle\text{human}|\text{human}\rangle = 1$ → pattern matches
4. Execute body: $|\text{mortal}\rangle$ (another ket, so continue chaining)
5. $\langle\text{mortal}|\text{mortal}\rangle = 1$ → pattern matches
6. Execute body: `|output>` → produces final text: "All things must end."

The inner products $\langle\text{human}|\text{human}\rangle$ and $\langle\text{mortal}|\text{mortal}\rangle$ both equal 1, so the operators compose seamlessly. This is **operator composition**—the mathematical structure underlying subroutine chaining.

### 3.5 Symbolic Summary

**Key insight:** Symbolic computation uses:
- **Discrete inner products** for pattern matching
- **Exact matching** (0 or 1)
- **Winner-take-all** selection
- **Compositional operators** for chaining

Next, we show neural computation uses the same structure with continuous metrics.

---

## 4. Neural Computation as Bra-Ket Operations

### 4.1 Neural Networks as Weighted Sums

Consider a single-layer neural network:
$$y = \sigma(Wx + b) \tag{3.1}$$

where $W$ is an $m \times n$ weight matrix, $x$ is an $n$-dimensional input vector, $b$ is an $m$-dimensional bias vector, and $\sigma$ is activation function applied element-wise.

**Bra-ket formulation:**

The matrix $W$ has rows $\langle w_i|$ for $i = 1, \ldots, m$. The matrix-vector product $Wx$ gives a vector with components:
$$(Wx)_i = \langle w_i|x\rangle \tag{3.2}$$

So the $i$-th output component is:
$$y_i = \sigma\left(\langle w_i|x\rangle + b_i\right) \tag{3.3}$$

The full output vector is:
$$|y\rangle = \sigma(W|x\rangle + |b\rangle) \tag{3.4}$$

We can also write this as a sum over basis vectors $|\alpha_i\rangle$ (the $i$-th standard basis vector or eigenvector of the output space):
$$|y\rangle = \sum_i y_i |\alpha_i\rangle = \sum_i \sigma\left(\langle w_i|x\rangle + b_i\right) |\alpha_i\rangle \tag{3.5}$$

**Compare to symbolic:**
$$\text{symbolic} = \sum_i |\alpha_i\rangle \cdot \theta(\langle\text{pattern}_i|x\rangle - 1) \tag{3.6a}$$
$$\text{neural} = \sum_i |\alpha_i\rangle \cdot \sigma(\langle w_i|x\rangle + b_i) \tag{3.6b}$$

The structures are identical! The only differences:
- Symbolic: discrete metric, step function $\theta$ (hard selection at threshold = 1)
- Neural: continuous metric, sigmoid $\sigma$ (soft selection)

### 4.2 Transformer Attention: The Central Mechanism

Transformer attention is the cornerstone of modern AI. We now show it's literally a bra-ket operator.

#### Standard Attention Definition

For a sequence of token embeddings $\{|o_i\rangle\}_{i=1}^n$:

**Projections:**
- Query: $|q_j\rangle = M_q |o_j\rangle$
- Keys: $|k_i\rangle = M_k |o_i\rangle$
- Values: $|v_i\rangle = M_v |o_i\rangle$

where $M_q, M_k, M_v$ are learned projection matrices.

**Attention output:**
$$\text{output}_j = \sum_i \alpha_{ij} |v_i\rangle \tag{3.7}$$

where attention weights:
$$\alpha_{ij} = \frac{\exp(\langle k_i|q_j\rangle / \sqrt{d})}{\sum_{i'} \exp(\langle k_{i'}|q_j\rangle / \sqrt{d})} \tag{3.8}$$

#### Operator Formulation

Rewrite as:
$$\text{output}_j = \sum_i |v_i\rangle \langle k_i|q_j\rangle \tag{3.9}$$

Factor out the query:
$$\text{output}_j = \left(\sum_i |v_i\rangle \langle k_i|\right) |q_j\rangle \tag{3.10}$$

**Key insight:** $\sum_i |v_i\rangle \langle k_i|$ is a **linear operator** built from context tokens!

This operator:
- Takes query $|q_j\rangle$ as input
- Projects onto each key direction $\langle k_i|$
- Returns weighted sum of values $|v_i\rangle$

#### Compact Sandwich Form

Now substitute the definitions of keys, values, and queries:
$$\sum_i |v_i\rangle \langle k_i| = \sum_i (M_v |o_i\rangle)(\langle o_i| M_k^T) \tag{3.11}$$

Factor out matrices:
$$= M_v \left(\sum_i |o_i\rangle\langle o_i|\right) M_k^T \tag{3.12}$$

Define the **self-projection operator**:
$$P = \sum_i |o_i\rangle\langle o_i| \tag{3.13}$$

This projects onto the subspace spanned by all token embeddings—it's the "memory" of all context.

Then:
$$\sum_i |v_i\rangle \langle k_i| = M_v \, P \, M_k^T \tag{3.14}$$

And the full attention output:
$$\text{output}_j = M_v \, P \, M_k^T M_q |o_j\rangle \tag{3.15}$$

**Final compact form:** Define $M_1 = M_v$ and $M_2 = M_k^T M_q$:

$$\boxed{\text{output}_j = M_1 |o\rangle\langle o| M_2 |x\rangle} \tag{3.16}$$

where $|x\rangle = |o_j\rangle$ is the input token.

#### Interpretation of Sandwich Structure

The operator $M_1 \, P \, M_2$ has clear semantics:

1. **$M_2$ transforms input:** Projects $|x\rangle$ into "query space"—formulates the question

2. **$P = |o\rangle\langle o|$ performs lookup:** Self-projection over context tokens—searches memory

3. **$M_1$ transforms output:** Projects matched results into "answer space"—interprets response

**Physical analogy:**
- $M_2$: Asking a question
- $P$: Looking up answers in a book (context)
- $M_1$: Interpreting what you found

**Symbolic parallel:**
- DIRAC function call: Discrete lookup ($\langle\text{def}|\text{call}\rangle = 0$ or $1$)
- Transformer attention: Continuous lookup ($\langle k_i|q_j\rangle \in [0,1]$ after softmax)
- **Same mathematical structure:** Inner product determines action

### 4.3 Why This Matters

The sandwich form $M_1 |o\rangle\langle o| M_2 |x\rangle$ reveals:

1. **Attention is function dispatch:** The self-projection $P$ acts like a dictionary/database of available functions

2. **Differentiability:** Unlike symbolic systems, every component is differentiable—enabling gradient-based learning

3. **Soft selection:** Instead of winner-take-all, attention weights all matches—more robust to noise

4. **Memory mechanism:** $P = \sum_i |o_i\rangle\langle o_i|$ explicitly represents "what's available in context"

### 4.4 Concrete Example: Knowledge Representation

To make this concrete, consider a classic knowledge representation problem with IS-A and HAS-A relationships.

**Knowledge base:**
1. **IS-A relationship:** "Zhi is Asian" → $|\text{Asian}\rangle\langle\text{Zhi}|$
2. **HAS-A relationship:** "Asians have black hair" → $|\text{black}\rangle\langle\text{hair}|\langle\text{Asian}|$ (a tensor with two bras)

**Query:** "What is Zhi's hair color?"

**Symbolic reasoning:**

Apply the IS-A relationship first:
$$|\text{Asian}\rangle\langle\text{Zhi}|\text{Zhi}\rangle = |\text{Asian}\rangle \cdot 1 = |\text{Asian}\rangle$$

Now apply the HAS-A relationship:
$$|\text{black}\rangle\langle\text{hair}|\langle\text{Asian}|\text{Asian}\rangle = |\text{black}\rangle\langle\text{hair}| \cdot 1$$

Finally, query with "hair":
$$|\text{black}\rangle\langle\text{hair}|\text{hair}\rangle = |\text{black}\rangle \cdot 1 = |\text{black}\rangle$$

**Answer:** Black

**Neural analog:**

In a neural network, the same relationships are represented with continuous similarities:
- IS-A: $\langle\text{Asian embedding}|\text{Zhi embedding}\rangle \approx 0.9$ (high similarity)
- HAS-A: $\langle\text{hair}|\langle\text{Asian}|\text{query}\rangle\rangle$ computes attention over the knowledge base

The transformer attention mechanism implements exactly this multi-hop reasoning:
1. First hop: $|\text{Zhi}\rangle$ attends to $|\text{Asian}\rangle$ (via IS-A similarity)
2. Second hop: $|\text{Asian}\rangle$ attends to $|\text{black hair}\rangle$ (via HAS-A similarity)
3. Final output: Context-enriched $|\text{color}'\rangle$ encoding "Zhi's hair is black"

**Key insight:** The tensor structure $|\text{black}\rangle\langle\text{hair}|\langle\text{Asian}|$ in symbolic KR is identical to the multi-head attention structure in transformers—both represent multi-way relationships through nested bra-ket products.

---

## 5. The Mathematical Duality: Core Theorem

### 5.1 Formal Equivalence Statement

**Theorem 1 (Symbolic-Neural Equivalence):**

Let $\{|\alpha_i\rangle, \langle\beta_i|\}_{i=1}^n$ be a set of action-pattern pairs (function definitions).

**Symbolic system:** For input $|x\rangle$, select $|\alpha_i\rangle$ if $\langle\beta_i|x\rangle = 1$ (exact match):
$$\text{output}_{\text{sym}} = \sum_i |\alpha_i\rangle \cdot \theta(\langle\beta_i|x\rangle - \tau) \tag{4.1}$$

where $\theta(z)$ is the Heaviside step function: $\theta(z) = 1$ if $z \geq 0$, else 0, and $\tau = 1$ for exact matching.

**Neural system:** For input $|x\rangle$, compute weighted sum:
$$\text{output}_{\text{neu}} = \sum_i |\alpha_i\rangle \cdot \sigma\left(\frac{\langle\beta_i|x\rangle - \tau}{\epsilon}\right) \tag{4.2}$$

where $\sigma$ is sigmoid function, $\tau$ is threshold, $\epsilon$ controls sharpness.

**Key observations:**

1. **Unified form:** Both equations have the same structure: $\sum_i |\alpha_i\rangle \cdot f(\langle\beta_i|x\rangle - \tau)$ where $f$ is either step function $\theta$ or sigmoid $\sigma$.

2. **Threshold flexibility:** 
   - $\tau = 1$: Rigid exact matching (symbolic case)
   - $\tau < 1$ (e.g., 0.8): Approximate matching (fuzzy symbolic or neural case)
   - This is exactly what DIRAC uses for tag matching and similarity-based dispatch!

3. **Temperature parameter $\epsilon$:**
   - $\epsilon \to 0$: Sharp boundary, $\sigma(z/\epsilon) \to \theta(z)$ (neural becomes symbolic)
   - $\epsilon$ small: Approximate step function (used in practice)
   - $\epsilon$ large: Smooth weighting (fully neural)

**Claim:**
$$\lim_{\epsilon \to 0} \text{output}_{\text{neu}} = \text{output}_{\text{sym}} \tag{4.3}$$

**Proof:**

Recall sigmoid:
$$\sigma(z) = \frac{1}{1 + e^{-z}} \tag{4.4}$$

Consider $\sigma(z/\epsilon)$ as $\epsilon \to 0$:
- If $z > 0$: $\sigma(z/\epsilon) \to 1$ (since $z/\epsilon \to +\infty$)
- If $z < 0$: $\sigma(z/\epsilon) \to 0$ (since $z/\epsilon \to -\infty$)
- If $z = 0$: $\sigma(0) = 0.5$

For our case, $z = \langle\beta_i|x\rangle - \tau$:
- If $\langle\beta_i|x\rangle > \tau$: $\sigma\left(\frac{\langle\beta_i|x\rangle - \tau}{\epsilon}\right) \to 1$
- If $\langle\beta_i|x\rangle < \tau$: $\sigma\left(\frac{\langle\beta_i|x\rangle - \tau}{\epsilon}\right) \to 0$

Setting $\tau$ slightly below 1 (e.g., $\tau = 0.99$), the neural system converges to:
$$\text{output}_{\text{neu}} \to \sum_i |\alpha_i\rangle \cdot \mathbb{1}(\langle\beta_i|x\rangle = 1) = \text{output}_{\text{sym}} \tag{4.5}$$

where $\mathbb{1}(\cdot)$ is indicator function. $\square$

**Corollary:** Symbolic tag-checking is the zero-temperature limit of a single-layer neural network.

### 5.2 The Duality Table

The correspondence between symbolic and neural paradigms:

| Aspect | Symbolic | Neural | Bra-Ket |
|--------|----------|--------|---------|
| **Match** | Exact (name lookup) | Similarity (cosine, dot product) | $\langle\beta\|x\rangle$ |
| **Metric** | Discrete (0 or 1) | Continuous ($[0,1]$) | Inner product space |
| **Selection** | Winner-take-all | Weighted average | argmax vs. softmax |
| **Composition** | Function nesting | Layer stacking | Operator product |
| **Learning** | Manual (programming) | Automatic (gradient descent) | Parameter optimization |
| **Binding** | Late (runtime lookup) | Early (learned weights) | Basis vector choice |
| **Context** | Scope/environment | Hidden state | State vector $|h\rangle$ |
| **Chaining** | Call stack | Recurrence/attention | Sequential operators |

### 5.3 Implications

**For AI theory:**
- Symbolic AI is not "different" from neural networks—it's a special case (discrete metric, zero temperature)
- The "symbolic vs. neural" debate is about continuous vs. discrete inner products, not fundamentally different computation

**For engineering:**
- We can build hybrid systems that interpolate between discrete and continuous
- Differentiability and symbolic control are compatible—just use appropriate thresholds and metrics

**For understanding LLMs:**
- Tool-calling works because attention implements differentiable function dispatch
- "Emergent" symbolic behavior isn't mysterious—LLMs learn continuous approximations to discrete operations

### 5.4 Parameters and Context Mixing: A Key Insight

The previous sections established that symbolic and neural systems share the same bra-ket structure for pattern matching and selection. However, there's a subtle but important question: **What is the neural correspondent of parameters in symbolic expressions?**

**The parameter puzzle:**

In quantum mechanics, bra-ket notation is parameter-free:
- $|\psi\rangle$: a state vector
- $\langle\phi|\psi\rangle$: inner product
- $|\phi\rangle\langle\psi|$: operator

But in symbolic AI, we need **parameterized states**:
- $|\text{set-background color=red}\rangle$
- $|\text{kick object=ball}\rangle$
- $|\text{greet person="Alice"}\rangle$

The parameter "color=red" or "object=ball" modifies the base action. This is not standard quantum notation—it's an extension for symbolic computation.

**The neural correspondent: Context mixing**

In neural networks, parameters correspond to **context blending through vector addition**:

| Symbolic | Neural |
|----------|--------|
| $\|\text{action param=value}\rangle$ | $\|\text{action}\rangle + \alpha \cdot \|\text{value}\rangle$ |
| Parameter binding (discrete) | Context mixing (continuous) |
| Creates parameterized state | Creates context-enriched embedding |

**Example: Building context**

**Symbolic sequence:**
$$|\text{Zhi}\rangle \xrightarrow{\text{add context}} |\text{Zhi wrote}\rangle \xrightarrow{\text{add context}} |\text{Zhi wrote code}\rangle$$

Each step **binds a new parameter** to the growing expression.

**Neural equivalent (attention):**
$$|\text{code}'\rangle = \sum_i \alpha_i |v_i\rangle = \alpha_{\text{Zhi}} |\text{Zhi}\rangle + \alpha_{\text{wrote}} |\text{wrote}\rangle + \alpha_{\text{code}} |\text{code}\rangle$$

The weighted sum **mixes context vectors** to create an embedding that encodes "code in the context of Zhi writing."

**Why this matters:**

1. **RNN context accumulation:**
   $$h_t = W_h h_{t-1} + W_x x_t + b$$
   The vector addition injects new information ($x_t$) into accumulated context ($h_{t-1}$), similar to binding a new parameter to a symbolic expression.

2. **Attention context composition:**
   $$\text{output}_j = \sum_i \alpha_{ij} |v_i\rangle$$
   The weighted sum fills in "parameters" by blending relevant context vectors.

3. **Parameter-value duality:**
   - Symbolic: $|\text{function param}_1\text{=}v_1 \text{ param}_2\text{=}v_2\rangle$ is a discrete structure
   - Neural: $|f\rangle + \alpha_1 |v_1\rangle + \alpha_2 |v_2\rangle$ is a continuous blend

**Hardware instruction analogy:**

This is analogous to how CPU instructions encode operations:

```
Machine instruction:  [opcode][arg1][arg2][arg3]
Example:             [ADD   ][R1  ][R2  ][R3  ]
```

In vector form:
$$|\text{instruction}\rangle = |\text{opcode}\rangle + |\text{arg}_1\rangle + |\text{arg}_2\rangle + |\text{arg}_3\rangle$$

**Symbolic (discrete):**
- Different bit positions for opcode vs arguments
- Exact values: ADD=0x01, R1=0x10, R2=0x11
- Hardware decodes by position: bits [0-7]=opcode, bits [8-15]=arg1, etc.

**Neural (continuous):**
- Different dimensions in embedding space for operation vs arguments
- Continuous values: embeddings in $\mathbb{R}^d$
- Network decodes by learned attention: which dimensions encode operation vs parameters

The neural network learns to **partition the embedding space** the way hardware partitions instruction bits—some dimensions encode the "opcode" (what action), others encode "arguments" (what parameters). Vector addition combines these components into a unified representation.

**The insight:**

Vector addition in neural networks (whether in RNNs or attention) is not arbitrary—it's the **continuous analog of parameter binding** in symbolic systems. When we write $|\text{kick object=ball}\rangle$, the neural network approximates this by mixing the embeddings of "kick" and "ball" in a learned vector space, similar to how a CPU instruction combines opcode and argument bits.

This explains why LLMs can perform complex reasoning: they're continuously interpolating over the space of parameterized symbolic expressions. The difference from traditional symbolic AI is that parameters are filled **fuzzily** (through vector arithmetic) rather than **discretely** (through exact binding).

---

## 6. DIRAC: Practical Symbolic-Neural Integration

### 6.1 Language Overview

DIRAC is a programming language that:
- Uses bra-ket syntax for symbolic operations
- Integrates neural operations (embeddings, LLM calls)
- Supports both exact and similarity-based matching
- Enables seamless composition of symbolic and neural code

**Example: Simple function call**

DIRAC supports both XML syntax and bra-ket shorthand:

**XML syntax:**
```xml
<subroutine name="greet" param-person="string:required:Person to greet">
  <output>Hello, <variable name="person"/>!</output>
</subroutine>

<greet person="Alice"/>
```

**Bra-ket shorthand syntax:**
```
<greet person="string"|
  |output> Hello, |variable name="person">
```

Call (ket):
```
|greet person="Alice">
```

Or simplified:
```
|greet Alice>
```

**Semantic interpretation:**

The subroutine definition `<greet person="string"|` creates a pattern (bra) that can match against calls (kets).

When a call `|greet person="Alice">` is executed:
1. **Pattern matching** via inner product: $\langle\text{greet pattern}|\text{call}\rangle$ checks if the call matches the signature
2. If match succeeds (returns 1), the body executes with the bound parameters
3. The output is produced by evaluating the ket: $|\text{output}\rangle = |\text{"Hello, Alice!"}\rangle$

This is **exactly** the symbolic dispatch pattern from Section 2: match via inner product, execute when match succeeds.

### 6.2 Embedding-Based Tag Matching

DIRAC supports **neural tag matching** using embeddings:

```xml
<subroutine name="calculate"
            param-expression="string:required:Mathematical expression">
  <!-- Tags can be used for semantic search -->
  <eval name="result"><!-- math logic --></eval>
  <output><variable name="result"/></output>
</subroutine>
```

For a call with semantic matching:
```xml
<!-- Direct call by name -->
<calculate expression="2 + 2"/>

<!-- Or use search-subroutines for semantic lookup -->
<search-subroutines query="arithmetic evaluate" limit="5"/>
```

The system:
1. Computes embeddings of call tags: `["arithmetic", "evaluate"]`
2. Computes embeddings of definition tags: `["math", "computation"]`
3. Calculates similarity: $\langle\text{def-tags}|\text{call-tags}\rangle$ (cosine similarity)
4. If similarity > threshold, executes `calculate`

**This is exactly the neural dispatch we formalized!**

### 6.3 The Aristotle Example

Classic syllogistic reasoning:
- All humans are mortal
- Socrates is human
- Therefore, Socrates is mortal

**Symbolic DIRAC:**
```xml
<!-- Define relationships as nested subroutines -->
<subroutine name="human">
  <mortal/>
</subroutine>

<subroutine name="Socrates">
  <human/>
</subroutine>

<!-- Chain inference: calling Socrates invokes human which invokes mortal -->
<Socrates/>
<!-- Output: executes mortal -->
```

Or in Dirac's bra-ket shorthand:
```
<human|
  |mortal>
  
<Socrates|
  |human>
```

In bra-ket form:
$$|\text{mortal}\rangle\langle\text{human}| \cdot |\text{human}\rangle\langle\text{Socrates}| \cdot |\text{Socrates}\rangle = |\text{mortal}\rangle$$

**Neural analog (transformer attention):**
- Context contains facts: "Socrates is human", "Humans are mortal"
- Query: "Is Socrates mortal?"
- Attention mechanism:
  - High weight on "Socrates is human" (query matches "Socrates")
  - High weight on "Humans are mortal" (intermediate result matches "human")
  - Output: High probability for "mortal"

Same logical structure, different implementation!

### 6.4 LLM Integration

DIRAC can delegate to LLMs for fuzzy/neural reasoning:

```xml
<llm model="gpt-4" execute="true" feedback="true" max-iterations="5">
  You are a helpful assistant. Analyze this code and suggest improvements:
  
  <variable name="code"/>
  
  You can use these DIRAC tags:
  - <eval>JavaScript code</eval>
  - <system>shell command</system>
  - <search-subroutines query="..."/> 
</llm>
```

The LLM:
- Receives context (system prompt, user code)
- Generates response using attention mechanism ($M_1 |o\rangle\langle o| M_2 |x\rangle$)
- Can invoke DIRAC actions (symbolic operations)
- Creates **ReAct loop:** reasoning + acting

This demonstrates **system-level intelligence:**
- Neural component (LLM) handles fuzzy reasoning
- Symbolic component (DIRAC) handles precise operations
- Composition creates capabilities beyond either alone

### 6.5 Subroutine Management

DIRAC maintains a **distributed knowledge base**:

```bash
~/.dirac/
  lib/
    system/         # Built-in functions
    user/           # User-defined
    project/        # Project-specific
```

When calling a subroutine:
1. Check session (recently defined)
2. Search user library (saved definitions)
3. Search project library (shared with team)
4. Search system library (built-ins)

This is **lazy loading with neural search:**
- Index subroutines by name and tags
- Use embeddings for similarity matching
- Load on-demand (not all in memory)

**Bra-ket view:** The library is a massive operator:
$$\mathcal{L} = \sum_i |\text{subroutine}_i\rangle\langle\text{signature}_i|$$

Calling a subroutine = applying this operator to input.

### 6.6 DISH: The DIRAC Shell

**DISH (DIRAC Shell)** is a practical implementation of neural-symbolic integration, analogous to bash in Unix but supporting both traditional shell commands and DIRAC's bra-ket notation.

**Example session:**
```bash
$ dish
dish> ls -la                    # Regular Unix command
dish> |greet "Alice">          # DIRAC ket (function call)
Hello, Alice!

dish> <calculate expr="2+2"|   # Define subroutine inline
  |eval> <variable name="expr">

dish> |calculate expr="5*3">   # Call it
15
```

**Key innovation: Context-aware LLM integration**

When DISH encounters an `<llm>` tag, it implements **automatic tool discovery**:

1. **Scan available subroutines:** Before calling the LLM, DISH searches the environment for all available DIRAC subroutines (session, user library, project library, system library)

2. **Push to context stack:** The subroutine signatures are pushed onto a context stack

3. **Augment LLM prompt:** When sending the request to the LLM, DISH attaches the available subroutines as part of the system prompt:
   ```
   You have access to the following DIRAC subroutines:
   - <calculate expr="string">: Evaluates mathematical expressions
   - <search-file pattern="string">: Searches files for patterns
   - <fetch-url url="string">: Fetches content from URLs
   ...
   ```

4. **LLM generates DIRAC tags:** The LLM can now respond with DIRAC tags (e.g., `<calculate expr="...">`) because it knows what's available

5. **Execute returned tags:** DISH parses and executes the DIRAC tags returned by the LLM

**This is the context mechanism that unifies symbolic and neural:**

**Mathematically:**
- Available subroutines form a basis: $\{|\alpha_1\rangle\langle\beta_1|, |\alpha_2\rangle\langle\beta_2|, \ldots\}$
- The context stack creates the self-projection operator: $P = \sum_i |\beta_i\rangle\langle\beta_i|$
- LLM attention: $M_1 P M_2 |x\rangle$ where $P$ encodes what tools are available
- LLM output: A ket like `|calculate expr="42+17">` that matches one of the $\langle\beta_i|$ patterns

**This solves the tool-calling problem:**
- **Traditional approach:** Hard-code tool schemas in LLM API calls (brittle, vendor-specific)
- **DIRAC approach:** Dynamically discover available subroutines and inject into context (flexible, extensible)

The LLM's attention mechanism ($M_1 |o\rangle\langle o| M_2 |x\rangle$) naturally implements tool selection because the context $|o\rangle$ includes the tool definitions, and the query $|x\rangle$ is the user's request.

### 6.7 Getting Started with DIRAC

DIRAC is available as an open-source npm package. To install:

```bash
npm install -g dirac-lang
```

This installs the DIRAC interpreter and DISH shell globally. After installation, you can:

**Run DIRAC files:**
```bash
dirac myprogram.di
```

**Launch DISH (interactive shell):**
```bash
dish
```

**Quick example:**
```bash
dish> |greet "World">
Hello, World!

dish> <calculate expr|
  |eval> <variable name="expr">

dish> |calculate expr="2+2">
4
```

For more information, documentation, and examples, visit: [https://diraclang.org](https://diraclang.org)

---

## 7. Related Work and Positioning

### 7.1 Symbolic AI Heritage

**Classical symbolic systems:**
- Lisp (McCarthy, 1960): S-expressions, function application
- Prolog (Colmerauer, 1972): Logic programming, unification
- Expert systems (1980s): Rule-based reasoning

**McCarthy's observation on structural equivalence:**
McCarthy noted that Lisp S-expressions and XML share the same fundamental structure—nested, tree-based representations. Both are forms of what we'd now call "serialized abstract syntax trees." Our work extends this: not only do Lisp and XML share structure, but this structure (nested operators acting on arguments) is mathematically equivalent to the tensor operations in neural networks when viewed through bra-ket notation.

**Our contribution:** Show these use discrete bra-ket inner products—same structure as neural networks.

### 7.2 Neural Network Theory

**Universal approximation (Hornik et al., 1989):**
- Neural networks can approximate any continuous function
- Our work: Shows they also approximate discrete symbolic operations (Theorem 1)

**Attention mechanisms (Vaswani et al., 2017):**
- "Attention is All You Need" introduced transformer architecture
- Our work: Derives compact sandwich form $M_1 |o\rangle\langle o| M_2 |x\rangle$ showing attention is literally bra-ket operator

### 7.3 Hybrid Systems

**Neural-symbolic integration (Garcez et al., 2009):**
- Logic Tensor Networks: Embed logic in tensor operations
- Differentiable Forth: Compile symbolic programs to differentiable form
- Our work: Show underlying unity—not "integration" but same mathematical structure

**Program synthesis (Ellis et al., 2021):**
- DreamCoder: Learn program abstractions from examples
- Our work: Provides theoretical foundation—programs are discrete neural networks

### 7.4 Quantum Computation

**Quantum algorithms (Nielsen & Chuang, 2000):**
- Use bra-ket notation for quantum states
- Our work: Applies same notation to classical computing, revealing hidden structure

**NOT quantum computing:** We use bra-ket notation as mathematical language, not quantum superposition or entanglement.

### 7.5 LLM Critiques and System Intelligence

**LeCun's critique (2023):**
- LLMs lack grounded world models (no sensor feedback)
- Cannot do goal→plan→act (reactive, not deliberative)

**Our response:**
- **System-level intelligence:** Neural + symbolic + tools = complete architecture
- LLMs implement differentiable dispatch—can plan via tool composition
- Missing: Not planning capability, but grounded physical representation
- DIRAC demonstrates compositional intelligence without massive sensors

**Philosophical position:**
- Intelligence need not be monolithic (single model doing everything)
- Cognitive architectures compose specialized components
- Neural and symbolic are "two faces of same coin"—both use bra-ket operations

---

## 8. Discussion and Future Directions

### 8.1 Theoretical Implications

**Unification of paradigms:**
- Symbolic and neural computation are not opposites—they're points on a continuum
- The spectrum: Discrete metric → Continuous metric
- The common structure: Bra-ket inner products

**Temperature as control parameter:**
- Zero temperature ($\epsilon \to 0$): Hard symbolic matching
- High temperature ($\epsilon$ large): Soft neural averaging
- Intermediate: Hybrid behavior (useful for robustness)

**Compositionality:**
- Both paradigms support operator composition
- Symbolic: Function nesting $g(f(x))$
- Neural: Layer stacking $L_2(L_1(x))$
- Unified: $|g\rangle\langle g| \cdot |f\rangle\langle f| \cdot |x\rangle$

### 8.2 Practical Applications

**Improved AI architectures:**
- Design networks with explicit symbolic structure
- Use attention as learnable function dispatch
- Mix discrete and continuous operations as needed

**Interpretability:**
- View neural networks as "soft programs"
- Attention weights = "which function got called"
- Enables debugging: "Why did model choose this action?"

**Efficiency:**
- Symbolic operations are deterministic (no sampling)
- Neural operations are robust (handle ambiguity)
- Hybrid systems get best of both

### 8.3 Limitations and Open Questions

**Limitations:**

1. **Scalability:** DIRAC currently limited to small-scale programs (not production-ready)

2. **Learning:** Symbolic parts require manual design (can't learn subroutine structure from data alone)

3. **Theory gaps:** We've shown equivalence in single-layer case; multi-layer composition needs deeper analysis

**Open questions:**

1. **Optimal temperature:** When to use discrete vs. continuous? Can this be learned?

2. **Hierarchical structure:** Can we learn symbolic abstractions (subroutines) from neural training?

3. **Verification:** Can we prove properties of hybrid systems (combining neural learning and symbolic guarantees)?

4. **Hardware:** Should we design chips that natively support bra-ket operations?

### 8.4 Future Research Directions

**Short-term:**
1. Extend Theorem 1 to multi-layer case
2. Prove sample complexity results (how much data needed to learn discrete structure?)
3. Benchmark DIRAC against pure symbolic and pure neural systems

**Medium-term:**
1. Auto-generate DIRAC subroutines from LLM interactions
2. Learn temperature/threshold parameters from data
3. Build large-scale knowledge bases using neural indexing

**Long-term:**
1. Theory of compositional intelligence (how do hybrid systems scale?)
2. Neurosymbolic AGI architectures (combining reasoning, learning, perception)
3. Formal verification of learned programs

### 8.5 Broader Impact

**Education:**
- Bra-ket notation unifies curricula: One formalism for symbolic AI, neural networks, quantum computing

**AI Safety:**
- Interpretable AI: Neural networks as "soft programs" easier to understand
- Formal verification: Symbolic components can be provably correct
- Controllability: Explicit symbolic rules prevent unintended behavior

**Scientific Computing:**
- Many domains use both symbolic (equations) and neural (data-driven) methods
- Unified framework enables seamless integration

---

## 9. Conclusion

We have demonstrated that symbolic and neural computation, historically viewed as opposing paradigms, are mathematically unified under bra-ket notation from quantum mechanics. The key insights:

1. **Structural identity:** Both paradigms perform inner product operations to select actions—symbolic systems use discrete metrics, neural systems use continuous metrics.

2. **Formal equivalence:** Symbolic tag-checking equals a single-layer neural network in the zero-temperature limit (Theorem 1).

3. **Compact attention form:** Transformer attention has sandwich structure $M_1 |o\rangle\langle o| M_2 |x\rangle$, explicitly showing self-projection over context tokens—attention is literally a bra-ket operator.

4. **Practical demonstration:** DIRAC language seamlessly integrates symbolic and neural operations, proving the theoretical unification has concrete engineering value.

5. **System-level intelligence:** Hybrid architectures (neural + symbolic + tools) achieve capabilities beyond pure neural or pure symbolic approaches, addressing critiques about LLM limitations.

This unification provides a mathematical foundation for the next generation of AI systems: architectures that fluidly combine the robustness of neural learning with the precision of symbolic reasoning. The future of AI is not "symbolic vs. neural" but rather their elegant composition, guided by the timeless mathematics of inner products.

**The lesson:** When you strip away implementation details—discrete vs. continuous, exact vs. approximate, hard vs. soft—you find the same mathematical skeleton: bra-ket operations determining computational actions. Symbolic and neural are two faces of the same coin, united by the language of linear algebra.

---

## References

1. Dirac, P.A.M. (1939). "A New Notation for Quantum Mechanics." *Mathematical Proceedings of the Cambridge Philosophical Society*, 35(3), 416-418.

2. McCarthy, J. (1960). "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I." *Communications of the ACM*, 3(4), 184-195.

3. Vaswani, A., et al. (2017). "Attention is All You Need." *Advances in Neural Information Processing Systems*, 30.

4. Hornik, K., Stinchcombe, M., & White, H. (1989). "Multilayer Feedforward Networks are Universal Approximators." *Neural Networks*, 2(5), 359-366.

5. Garcez, A., Broda, K., & Gabbay, D. (2009). *Neural-Symbolic Cognitive Reasoning*. Springer.

6. Nielsen, M.A. & Chuang, I.L. (2000). *Quantum Computation and Quantum Information*. Cambridge University Press.

7. Ellis, K., et al. (2021). "DreamCoder: Bootstrapping Inductive Program Synthesis with Wake-Sleep Library Learning." *PLDI 2021*.

8. Colmerauer, A., et al. (1972). "Un système de communication homme-machine en français." *Research Report, Université d'Aix-Marseille*.

9. LeCun, Y. (2023). "A Path Towards Autonomous Machine Intelligence." *Technical Report*.

10. Goodfellow, I., Bengio, Y., & Courville, A. (2016). *Deep Learning*. MIT Press.

---

## Appendix A: Mathematical Preliminaries on Bra-Ket Notation

This appendix provides formal definitions of bra-ket notation for readers unfamiliar with the formalism. Those comfortable with quantum mechanics notation or linear algebra can skip this section.

### A.1 Bra-Ket Notation Basics

Bra-ket notation, introduced by Paul Dirac for quantum mechanics, provides a coordinate-free way to express linear algebra operations.

**Kets** represent vectors (column vectors in matrix notation):
$$|ψ\rangle \in \mathcal{H}$$

where $\mathcal{H}$ is a Hilbert space (inner product space).

**Bras** represent dual vectors (row vectors):
$$\langle φ| \in \mathcal{H}^*$$

where $\mathcal{H}^*$ is the dual space.

**Inner product** (bra-ket contraction):
$$\langle φ | ψ \rangle \in \mathbb{C} \quad \text{(or } \mathbb{R} \text{ for real vector spaces)}$$

Properties:
- **Linearity:** $\langle φ | (a|ψ_1\rangle + b|ψ_2\rangle) = a\langle φ|ψ_1\rangle + b\langle φ|ψ_2\rangle$
- **Conjugate symmetry:** $\langle φ|ψ\rangle = \overline{\langle ψ|φ\rangle}$
- **Positive definite:** $\langle ψ|ψ\rangle \geq 0$, with equality iff $|ψ\rangle = 0$

**Outer product** creates an operator:
$$|ψ\rangle\langle φ| : \mathcal{H} \to \mathcal{H}$$

Acting on a vector:
$$(|ψ\rangle\langle φ|) |x\rangle = |ψ\rangle (\langle φ|x\rangle) = \langle φ|x\rangle |ψ\rangle$$

This operator projects $|x\rangle$ onto $\langle φ|$ (measuring similarity) and scales $|ψ\rangle$ by that projection.

### A.2 Matrix Representation

Given an orthonormal basis $\{|e_i\rangle\}_{i=1}^n$:

**Ket as column vector:**
$$|ψ\rangle = \sum_i ψ_i |e_i\rangle \leftrightarrow \begin{bmatrix} ψ_1 \\ ψ_2 \\ \vdots \\ ψ_n \end{bmatrix}$$

**Bra as row vector:**
$$\langle φ| = \sum_i φ_i^* \langle e_i| \leftrightarrow \begin{bmatrix} φ_1^* & φ_2^* & \cdots & φ_n^* \end{bmatrix}$$

**Inner product as vector multiplication:**
$$\langle φ|ψ\rangle = \sum_i φ_i^* ψ_i = \vec{φ}^\dagger \vec{ψ}$$

**Outer product as matrix:**
$$|ψ\rangle\langle φ| = \sum_{i,j} ψ_i φ_j^* |e_i\rangle\langle e_j| \leftrightarrow \vec{ψ} \vec{φ}^\dagger$$

### A.3 Projection Operators

A projection operator $P$ satisfies $P^2 = P$ (idempotent):

$$P = |ψ\rangle\langle ψ| \quad \text{(assuming } \langle ψ|ψ\rangle = 1\text{)}$$

For multiple orthonormal vectors:
$$P = \sum_i |ψ_i\rangle\langle ψ_i|$$

This projects onto the subspace spanned by $\{|ψ_i\rangle\}$.

**Key property (resolution of identity):** If $\{|ψ_i\rangle\}$ form a complete orthonormal basis:
$$\sum_i |ψ_i\rangle\langle ψ_i| = I$$

### A.4 Why Bra-Ket for Computing?

Advantages over standard matrix notation:

1. **Coordinate-free:** Emphasizes operations and their meaning, not specific numerical representations
2. **Compositional:** $\langle φ|M|ψ\rangle$ clearly shows operator $M$ sandwiched between states
3. **Intuitive semantics:** Bra "asks a question," ket "provides an answer," inner product "measures match"
4. **Operator algebra:** $|α\rangle\langle β|$ naturally represents transformations from $\beta$ to $\alpha$
5. **Unifying notation:** Same formalism works for symbolic (discrete) and neural (continuous) computation

---

## Appendix B: Mathematical Proofs

### B.1 Projection Operator Properties

**Lemma 1:** For normalized $|ψ\rangle$ with $\langle ψ|ψ\rangle = 1$, the operator $P = |ψ\rangle\langle ψ|$ satisfies $P^2 = P$ (idempotent).

**Proof:**
$$P^2 = (|ψ\rangle\langle ψ|)(|ψ\rangle\langle ψ|) = |ψ\rangle(\langle ψ|ψ\rangle)\langle ψ| = |ψ\rangle \cdot 1 \cdot \langle ψ| = P \quad \square$$

**Lemma 2:** For orthonormal basis $\{|e_i\rangle\}_{i=1}^n$, we have $\sum_i |e_i\rangle\langle e_i| = I$ (identity).

**Proof:**
For any $|x\rangle = \sum_j x_j |e_j\rangle$:
$$\left(\sum_i |e_i\rangle\langle e_i|\right)|x\rangle = \sum_i |e_i\rangle \langle e_i| \sum_j x_j |e_j\rangle = \sum_i \sum_j x_j |e_i\rangle \delta_{ij} = \sum_i x_i |e_i\rangle = |x\rangle \quad \square$$

### B.2 Sigmoid Limit Behavior

**Lemma 3:** For sigmoid $\sigma(z) = \frac{1}{1+e^{-z}}$:
$$\lim_{\epsilon \to 0^+} \sigma(z/\epsilon) = \begin{cases} 1 & \text{if } z > 0 \\ 1/2 & \text{if } z = 0 \\ 0 & \text{if } z < 0 \end{cases}$$

**Proof:**
For $z > 0$: $\lim_{\epsilon \to 0^+} \frac{1}{1+e^{-z/\epsilon}} = \frac{1}{1+0} = 1$ (since $e^{-\infty} = 0$)

For $z < 0$: $\lim_{\epsilon \to 0^+} \frac{1}{1+e^{-z/\epsilon}} = \frac{1}{1+\infty} = 0$ (since $e^{+\infty} = \infty$)

For $z = 0$: $\sigma(0/\epsilon) = \sigma(0) = \frac{1}{1+1} = 1/2$ for all $\epsilon$ $\quad \square$

---

## Appendix C: DIRAC Language Specification

### C.1 Core Syntax

**Subroutine Definition:**
```xml
<subroutine name="subroutine-name"
            description="Brief description"
            param-param1="type:required:Description"
            param-param2="string:optional:Description">
  <!-- Body: computation logic -->
  <output>Result</output>
</subroutine>
```

**Subroutine Call:**
```xml
<subroutine-name param1="value1" param2="value2"/>
```

**Embedding-Based Call:**
```xml
<call embedding-search="true">
  <tag>fuzzy-tag</tag>
  <param name="param1">value</param>
</call>
```

### C.2 Control Flow

**Conditional:**
```xml
<if>
  <cond><expr eval="eq"><arg>$x</arg><arg>5</arg></expr></cond>
  <then><output>x is 5</output></then>
  <else><output>x is not 5</output></else>
</if>

<!-- Or attribute-based -->
<test-if test="$x" eq="5">
  <output>x is 5</output>
</test-if>
```

**Iteration:**
```xml
<!-- Fixed count loop -->
<loop count="10" var="i">
  <output>Iteration <variable name="i"/></output>
</loop>

<!-- Iterate over XML elements -->
<foreach from="$xml_content" as="item">
  <output><variable name="item"/></output>
</foreach>
```

### C.3 LLM Integration

**LLM Call with Feedback:**
```xml
<llm model="model-name" 
     execute="true" 
     feedback="true" 
     max-iterations="5"
     save-dialog="true">
  User prompt goes here as text content.
  
  Available actions are automatically inferred from imported subroutines.
  
  The LLM can generate DIRAC tags which will be executed.
</llm>
```

---

## Appendix D: Implementation Notes

### D.1 Embedding Computation

DIRAC uses sentence embeddings (e.g., BERT, Sentence-BERT) for tag matching:

```typescript
function computeSimilarity(tags1: string[], tags2: string[]): number {
  const emb1 = embed(tags1.join(' '));
  const emb2 = embed(tags2.join(' '));
  return cosineSimilarity(emb1, emb2);
}
```

Threshold for matching (default: 0.7):
```typescript
if (similarity > threshold) {
  // Execute subroutine
}
```

### D.2 Subroutine Indexing

Build index at startup:
```typescript
interface SubroutineIndex {
  name: string;
  tags: string[];
  embedding: number[];
  sourcePath: string;
}

function indexLibrary(dir: string): SubroutineIndex[] {
  const files = listDiracFiles(dir);
  return files.map(file => {
    const sub = parse(file);
    return {
      name: sub.name,
      tags: sub.tags,
      embedding: embed(sub.tags.join(' ')),
      sourcePath: file
    };
  });
}
```

### D.3 Performance Considerations

**Lazy loading:** Don't load all subroutines into memory—index only, load on demand.

**Caching:** Cache embeddings (expensive to compute).

**Approximate search:** Use FAISS or similar for fast nearest-neighbor search in embedding space.

---

**End of Paper**

*Word Count: ~11,500*

*Estimated Page Count: ~25-30 pages (single-column), ~45-50 pages (two-column conference format)*
