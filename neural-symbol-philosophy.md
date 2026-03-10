# Neural-Symbolic Philosophy in DIRAC

This document explores the evolving relationship between symbolic computation (as in DIRAC’s subroutines, calls, and logic) and neural computation (vectors, tensors, and continuous operations), as developed in the DIRAC project.

## Bridging Symbolic and Neural

- **Bra-ket as Symbolic:** In DIRAC, `<bra|` and `|ket>` are symbolic—subroutines, calls, and variable bindings.
- **Bra-ket as Neural:** In neural nets, these become vectors/tensors, and operations like $| \alpha \rangle \langle \beta | x \rangle$ are linear algebra (matrix-vector products).
- **Embedding Match:** By introducing embedding-based tag-checks, symbolic tags are mapped to vectors, and “matching” is a neural operation (cosine similarity, thresholding, etc.).
- **Rectlinear/Nonlinear Layer:** The introduction of $[Ax + b]$ (with $[\cdot]$ as rectlinear, e.g., ReLU) means moving from pure linear algebra to neural-style nonlinearities—just like a single-layer neural network.
- **Thresholding:** $| \alpha \rangle [\langle \beta | x \rangle - \tau]$ expresses “fire if similarity exceeds threshold,” a classic neural activation pattern.

## What This Means
- Symbolic and neural operations are not separate, but can be composed and interleaved.
- The “rectlinear” operation (angular brackets) is a bridge: it allows symbolic logic to be “softened” by neural similarity, and neural nets to be “sharpened” by symbolic structure.
- As this generalizes, we can imagine multi-layer compositions, attention-like mechanisms, or even symbolic-neural hybrids where subroutine calls are weighted by neural activations.

## Symbolic Tag-Check and Neural Network Equivalence

Let’s formalize the connection between DIRAC’s symbolic tag-check and neural network math:

### Symbolic Tag-Check (DIRAC)
- For each available operator (subroutine/tag) $i$, you have $|\alpha_i\rangle$ (the action) and $\langle\beta_i|$ (the embedding/query).
- For an input $|x\rangle$, compute the match: $\langle\beta_i|x\rangle$.
- If $[\langle\beta_i|x\rangle - \tau] > 0$, select/call $|\alpha_i\rangle$.

**Symbolic sum:**
$$
\sum_i |\alpha_i\rangle \cdot [\langle\beta_i|x\rangle - \tau]
$$
where $[\cdot]$ is the rectlinear (ReLU) operation.

### Neural Network (Single Layer)
- Weights $A$ (rows are $\beta_i$), bias $b$ (could be $-\tau$), output vectors $|\alpha_i\rangle$.
- The operation is:
$$
y = [A x + b]
$$
or, expanded:
$$
y_i = [\langle\beta_i|x\rangle - \tau]
$$

To combine actions:
$$
\text{output} = \sum_i |\alpha_i\rangle \cdot y_i
$$

### Key Insight
- **Symbolic tag-check**: Discrete selection based on thresholded match.
- **Neural network**: Continuous, parallel computation, thresholded by ReLU.

If the rectlinear operation is outside the sum:
$$
\text{output} = \left[ \sum_i |\alpha_i\rangle \cdot (\langle\beta_i|x\rangle - \tau) \right]
$$
This matches the one-layer neural network operation, where the sum is computed first, then thresholded.

**Conclusion:**
DIRAC’s symbolic tag-check is mathematically equivalent to a one-layer neural network, with the only difference being whether thresholding happens before or after the sum. This bridges symbolic selection and neural computation.

## Modularity vs. Interference: Symbolic vs. Neural

A key distinction between symbolic and neural approaches is how new knowledge interacts with existing knowledge:

### Symbolic AI (DIRAC-style)
- Operators/subroutines are discrete and modular.
- New rules or subroutines can be added without affecting existing ones, unless intentionally overridden.
- Even with embedding-based tag-checks (soft selection), unrelated subroutines remain unaffected.
- **Compositionality and locality:** Adding new knowledge is safe and predictable.

### Neural Networks (Rectlinear over Summation)
- With $\left[\sum_i |\alpha_i\rangle (\langle\beta_i|x\rangle - \tau)\right]$, all $|\alpha_i\rangle$ and $\langle\beta_i|$ are mixed in the sum.
- **Adding a new operator changes the output for all inputs,** because the sum and threshold are global.
- **No locality:** New knowledge can interfere with old knowledge (catastrophic interference).
- This is why neural nets need retraining and why continual learning is hard.

### The Core Tradeoff
- **Symbolic:** Safe, modular, compositional, but brittle and discrete.
- **Neural:** Flexible, generalizing, but global and prone to interference.

### In DIRAC’s Hybrid
- Keeping the rectlinear (threshold) inside the sum (i.e., $[\langle\beta_i|x\rangle - \tau]$ per-operator) preserves symbolic modularity: each operator fires independently.
- Moving the rectlinear outside the sum gives neural-style global mixing, and adding new operators can affect all outputs.

**Summary:**
- The placement of the rectlinear operation determines whether the system behaves more like symbolic AI (modular, safe) or neural nets (global, entangled).
- For hybrid systems, per-operator thresholding is preferable for modularity, while global thresholding is useful for generalization when explicitly desired.

## Orthogonality, Interference, and Hybrid Reasoning

A further subtlety arises depending on the relationship between the vectors (features/operators):

- **Orthogonal Vectors (One-hot, Non-overlapping):**
  - If $|\alpha_i\rangle$ and $|\alpha_j\rangle$ occupy different dimensions, the placement of the rectlinear (threshold/ReLU) inside or outside the summation makes little difference.
  - There is no interference; each subroutine or feature acts independently—mirroring symbolic modularity.

- **Overlapping Vectors (Shared Dimensions):**
  - If $|\alpha_i\rangle$ and $|\alpha_j\rangle$ share dimensions, the sum mixes their contributions, and the placement of the rectlinear matters.
  - Interference can occur: new knowledge can reinforce or contradict old knowledge, just as in real-world reasoning (e.g., updating beliefs about an entity).
  - Sometimes, this interference is desirable—it enables generalization, analogy, and context-dependent reasoning.

- **Hybrid Approach:**
  - You can design systems where some operators are orthogonal (symbolic, safe), and others are intentionally overlapping (neural, context-sensitive).
  - The choice of representation (basis) and the placement of the rectlinear operation gives a spectrum between pure symbolic and pure neural.

**Summary:**
- Interference is only a problem if strict modularity is required.
- In many cases, controlled interference enables richer, more flexible reasoning.
- DIRAC’s hybrid can support both modes, and the designer can choose per use-case.

## Tensor-Based RNNs and DIRAC Symbolic Chaining

### Example: Three-Level Knowledge Base

- **DIRAC symbolic representation:**
  - Two blocks:
    1. $|zhi\text{’s hair}\rangle \langle hair| \langle zhi|$ — defines the “hair” property for “zhi”
    2. $|black\rangle \langle color| \langle zhi\text{’s hair}|$ — defines the “color” property for “zhi’s hair”
  - The vector $|zhi\text{’s hair}\rangle$ acts as a hidden state, chaining the two rules.

- **Subroutine analogy:**
  - In DIRAC, this is two subroutines:
    - One defines $|zhi\text{’s hair}\rangle$ from $|zhi\rangle$ and $|hair\rangle$
    - One defines $|black\rangle$ from $|zhi\text{’s hair}\rangle$ and $|color\rangle$
  - Symbolic call: $|zhi\rangle \rightarrow |hair\rangle \rightarrow |color\rangle$

### RNN (Tensor-Based)

- **Standard RNN:** Uses matrices for hidden state transitions: $h_{t+1} = f(W h_t + U x_t + b)$
- **Tensor RNN:** Uses higher-order tensors for richer, multi-way interactions:
  - $h_{t+1} = f(\mathcal{T} \cdot h_t \cdot x_t)$
  - $\mathcal{T}$ is a 3-way tensor, allowing more expressive relationships.

- **Parallel to DIRAC:**
  - The “hidden state” $|zhi\text{’s hair}\rangle$ is analogous to $h_t$ in RNNs.
  - The chaining of subroutines is like the recurrent application of tensor operations.
  - The right-to-left notation $|alpha\rangle \langle beta| \langle gamma|$ matches the multi-way contraction in tensor RNNs.

> **Note:**
> The mapping described here is between DIRAC’s symbolic chaining and tensor-based RNNs (multi-way interactions). Matrix-based RNNs, which only support two-way linear combinations (hidden and input), do not directly capture the multi-way compositional relationships found in DIRAC’s symbolic AI. Our focus is on the tensor-based RNN parallel.

### Key Insight

- **DIRAC’s symbolic chaining** is structurally equivalent to tensor-based RNNs, where each “subroutine” is a slice of the tensor, and the hidden state is passed along.
- **Tensor RNNs** generalize matrix RNNs, just as DIRAC’s multi-level subroutine calls generalize simple function calls.

---

Further topics and examples will be added as the discussion evolves.

## Next Steps for Exploration
- How to generalize the rectlinear operation? (e.g., multi-layer, attention, gating, etc.)
- How to represent and compose these hybrid operations in DIRAC’s syntax?
- What are the implications for learning, reasoning, and explainability?

This is a living document—future discussions and technical details will be added as the philosophy and implementation evolve.

## Transformer Self-Attention: Rigorous Mathematical Form (with Token Indices)

Let $X = [X_1, X_2, \ldots, X_n]$ be the input sequence, where each $X_i \in \mathbb{R}^d$ is the embedding of the $i$-th token.

1. **Compute queries, keys, and values for each token:**
$$
Q_i = X_i W^Q, \quad K_i = X_i W^K, \quad V_i = X_i W^V
$$
where $W^Q, W^K, W^V \in \mathbb{R}^{d \times d_k}$ are learned parameter matrices.

2. **Compute attention scores and weights:**
$$
A_{ij} = \frac{Q_i \cdot K_j^\top}{\sqrt{d_k}}
$$
$$
\alpha_{ij} = \frac{\exp(A_{ij})}{\sum_{j'=1}^n \exp(A_{ij'})}
$$

3. **Compute the output for each token $i$ as a weighted sum over all value vectors:**
$$
Y_i = \sum_{j=1}^n \alpha_{ij} V_j
$$

Or, in matrix form for the whole sequence:
$$
Y = \text{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

Where $Q, K, V \in \mathbb{R}^{n \times d_k}$ stack the $Q_i, K_i, V_i$ row-wise.

> **Note:** For multi-head attention, this process is repeated in parallel for each head, and the results are concatenated and linearly projected.

> **Philosophical Note:**
> In the transformer self-attention mechanism, the keys ($K$) and values ($V$) are derived from the same set of input tokens—effectively, they represent the same "words" or symbolic entities. This can be viewed as forming a shared subroutine or tensor, which is then operated on by different queries ($Q$). Each query $Q_i$ interacts with the entire set of $K_j, V_j$, analogous to invoking a symbolic subroutine with different arguments or perspectives. This highlights a deep parallel between the transformer’s attention operation and symbolic reasoning over a shared knowledge base or tensor structure.

## Transformer Operation: Projection Function Perspective

Let’s recast the transformer’s self-attention in terms of projection functions, for greater intuitive clarity:

- Each token $|x_j\rangle$ creates a projection function $|V_j\rangle\langle K_j|$.
- The calling token $|x_i\rangle$ consults each projection function $|V_j\rangle\langle K_j|$ to see how much of its own query $|Q_i\rangle$ is projected onto $K_j$.
- The result is a collection of vectors $|V_j\rangle$ (directions), each scaled by the projection (amount), which together compose the new vector for $|x_i\rangle$.

For each token $i$:
$$
Y_i = \sum_j \text{projection}_{ij} \cdot |V_j\rangle
$$
where $\text{projection}_{ij} = \langle Q_i | K_j \rangle$ (or its normalized version).

This means:
- The focus is on the projection function $|V_j\rangle\langle K_j|$ for each token.
- The context for $|x_i\rangle$ is built by “borrowing” directions from all other tokens, weighted by how much $|Q_i\rangle$ aligns with their $K_j$.

This approach centers the intuition on how each token’s projection function shapes the context, rather than on the attention score itself.

## Matrix-Based RNNs: Symbolic Mapping and Peculiarities

In the standard matrix-based RNN, the update rule is:
$$
h_t = f(W_h h_{t-1} + W_x x_t)
$$
where $h_{t-1}$ is the previous hidden state, $x_t$ is the current input, and $W_h$, $W_x$ are weight matrices. The new context vector $h_t$ is a sum of two transformed vectors: the old context and the new token.

Symbolically, this is peculiar: you don’t usually “add” the results of two subroutine calls. In DIRAC, you’d call a subroutine with a parameter, like $|x\, \text{param}=c\rangle$, not $|c\rangle + |x\rangle$. So, the closest symbolic parallel is that the new context is a subroutine (or template) $|x\rangle$ with its parameter filled by the previous context $c$.

If you have something like $|a\, \text{param}=x\rangle\langle b|$, and you call it with $|b\rangle$ and $|y\rangle$, it becomes $|a\, \text{param}=y\rangle$. The “addition” in RNNs is more like parameter passing in symbolic systems, not true summation of independent results.

This is a key difference: matrix RNNs blend information by addition, while symbolic systems compose by parameterization or chaining. The “summation” is a shortcut for context injection, not a true symbolic operation.

> **Further Analogy:**
> The final hidden vector in a matrix-based RNN can be seen as analogous to a single ket with multiple parameters encoding the accumulated context. For example, $|\text{color}\ \text{what}=\text{hair}\ \text{who}=\text{Zhi}\rangle$ represents a symbolic state where the context ("hair" and "Zhi") is embedded as parameters. In the RNN, the sequence $|\text{Zhi}\rangle|\text{hair}\rangle|\text{color}\rangle$ is processed so that the resulting hidden state encodes all this contextual information, much like a ket with filled parameters.

## Parallel: Token Processing in Transformers vs. RNNs

Consider the sequence $|\text{Zhi}\rangle|\text{hair}\rangle|\text{color}\rangle$.

- **In the transformer:**
  - Each token is first embedded as a vector: $|\text{Zhi}\rangle, |\text{hair}\rangle, |\text{color}\rangle$.
  - Through the attention layer, each token is updated by gathering context from all tokens, resulting in new, context-enriched vectors: $|\text{Zhi}'\rangle, |\text{hair}'\rangle, |\text{color}'\rangle$.
  - For example, $|\text{color}'\rangle$ now encodes information about both “hair” and “Zhi”, not just “color” in isolation.
  - After further processing (e.g., feedforward layers, possibly more attention), the final output for the last position can be interpreted as $|\text{color}\ \text{what}=\text{hair}\ \text{who}=\text{Zhi}\rangle$—a vector that encodes the full context.

- **In the RNN:**
  - The sequence is processed step by step, with each new hidden state accumulating context from previous tokens.
  - The final hidden state after $|\text{color}\rangle$ similarly encodes the accumulated context, which can be interpreted as $|\text{color}\ \text{what}=\text{hair}\ \text{who}=\text{Zhi}\rangle$.

**Summary:**
- Both architectures transform the original tokens into new, context-rich representations.
- In transformers, this happens in parallel via attention; in RNNs, it happens sequentially via recurrence.
- The final output vector for “color” in both cases encodes the “what” and “who” context, but the mechanism of context injection differs.

## Value-Only Parameters in Bra-Ket Notation and Context Composition

In our extended bra-ket notation, we allow parameters to be represented as pure values, without explicit names. For example, the query for “Zhi’s hair color” can be written simply as:
$$
|color\ hair\ zhi\rangle
$$
This keeps the notation clean and close to S-expressions or functional argument lists.

### Context Composition in RNNs and Transformers

- **RNN:**
  - The input is a sequence of kets: $|Zhi\rangle|hair\rangle|color\rangle$.
  - The hidden state is updated step by step, each time adding the transformed previous state and the new token.
  - After processing the sequence, the hidden state encodes all the information—effectively $|color\ hair\ zhi\rangle$ as a single, context-rich ket.

- **Transformer:**
  - The input is also a sequence of kets: $|Zhi\rangle|hair\rangle|color\rangle$.
  - Each token’s output is a sum (weighted by attention) of the value vectors $|V\rangle$ from all tokens.
  - For the last token, $|color\rangle$ is updated by “borrowing” context from $|hair\rangle$ and $|Zhi\rangle$, so the final vector encodes the whole context—again, conceptually $|color\ hair\ zhi\rangle$.

**Summary:**
Both RNNs and transformers act as mechanisms for context composition: they take a sequence of kets and, through their respective machinery, produce a single ket that encodes the full context as a vector. This value-only parameter style makes the process visually and conceptually clear.

## Discussion: Vector Addition, Self-Reflection, and RNN Flexibility

**Q:** If we have word vectors like $|color\rangle$ and $|hair\rangle$, does adding them in embedding space ($|color\rangle + |hair\rangle$) correspond to composing context as $|color\ hair\rangle$?

**A:** In embedding space, vector addition does produce a new vector that loosely represents the combined context. However, in RNNs, the process is more nuanced: each input is first transformed by a weight matrix ($W_x$ for the current token, $W_h$ for the context), and then the results are added. The final hidden state is $h_t = W_x |color\rangle + W_h |context\rangle$, followed by a nonlinearity. So, the composition is not always a simple sum of raw word vectors.

**Q:** What if the weight matrices $W_x$ or $W_h$ are self-reflection operators, like $|color\rangle\langle color|$?

**A:** If $W_x$ or $W_h$ are (or contain) projection operators like $|color\rangle\langle color|$, the transformation could be as simple as passing the vector through unchanged or scaling it. In this case, the addition in the RNN could closely resemble $|color\rangle + |hair\rangle$. But in general, $W_x$ and $W_h$ can perform more complex, learned transformations, mixing or rotating the vectors in embedding space.

**Summary:**
- The RNN’s flexibility comes from its ability to learn when to preserve, transform, or mix context and input, depending on the task.
- In some cases, the RNN’s update may look like a simple addition in embedding space, but more generally, it is a learned, dynamic combination.
- Symbolically, $|color\ hair\rangle$ in bra-ket notation captures the idea of context composition, even though literal vector addition is not a symbolic operation.
