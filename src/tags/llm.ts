/**
 * <LLM> tag - THE INNOVATION
 * Execute LLM operation with recursive Dirac execution capability
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable, substituteVariables, emit, getVariable } from '../runtime/session.js';
import { integrate } from '../runtime/interpreter.js';
import { DiracParser } from '../runtime/parser.js';

export async function executeLLM(session: DiracSession, element: DiracElement): Promise<void> {
  if (!session.llmClient) {
    throw new Error('<LLM> requires API key (set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env file)');
  }
  
  // Check limits
  if (session.limits.currentLLMCalls >= session.limits.maxLLMCalls) {
    throw new Error('Maximum LLM calls exceeded');
  }
  
  session.limits.currentLLMCalls++;
  
  // Detect provider from client type
  const isOpenAI = session.llmClient.constructor.name === 'OpenAI';
  const defaultModel = isOpenAI ? 'gpt-4-turbo-preview' : 'claude-sonnet-4-20250514';
  
  const model = element.attributes.model || process.env.DEFAULT_MODEL || defaultModel;
  const outputVar = element.attributes.output;
  const contextVar = element.attributes.context;
  const executeMode = element.attributes.execute === 'true'; // NEW: seamless execution mode
  const temperature = parseFloat(element.attributes.temperature || '1.0');
  const maxTokens = parseInt(element.attributes.maxTokens || '4096', 10);
  
  // Build prompt from children or text
  let prompt = '';
  
  if (element.children.length > 0) {
    // Execute children to build prompt
    const beforeOutput = session.output.length;
    
    for (const child of element.children) {
      await integrate(session, child);
    }
    
    // Collect output from children
    const childOutput = session.output.slice(beforeOutput);
    prompt = childOutput.join('');
    
    // Remove child output from main output
    session.output = session.output.slice(0, beforeOutput);
    
  } else if (element.text) {
    prompt = substituteVariables(session, element.text);
  } else {
    throw new Error('<LLM> requires prompt content');
  }
  
  // Add context if specified
  if (contextVar) {
    const contextValue = getVariable(session, contextVar);
    if (contextValue) {
      prompt = `Context: ${contextValue}\n\n${prompt}`;
    }
  }
  
  if (session.debug) {
    console.error(`[LLM] Calling ${model} with prompt length: ${prompt.length}`);
  }
  
  try {
    let result: string;
    
    if (isOpenAI) {
      // Call OpenAI API
      const response = await session.llmClient.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
      
      result = response.choices[0]?.message?.content || '';
      
    } else {
      // Call Anthropic API
      const response = await session.llmClient.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
      
      const content = response.content[0];
      result = content.type === 'text' ? content.text : '';
    }
    
    if (session.debug) {
      console.error(`[LLM] Response length: ${result.length}`);
    }
    
    // Store in variable if requested
    if (outputVar) {
      setVariable(session, outputVar, result, false);
    } else if (executeMode) {
      // NEW: Execute mode - parse and interpret LLM response as Dirac code
      if (session.debug) {
        console.error(`[LLM] Executing response as Dirac code:\n${result}\n`);
      }
      
      // Strip markdown code blocks if present
      let diracCode = result.trim();
      if (diracCode.startsWith('```')) {
        diracCode = diracCode.replace(/^```(?:xml|html|dirac)?\n?/m, '').replace(/\n?```$/m, '').trim();
      }
      
      try {
        // Parse and execute the LLM's output as Dirac code
        const parser = new DiracParser();
        const dynamicAST = parser.parse(diracCode);
        await integrate(session, dynamicAST);
      } catch (parseError) {
        // If parsing fails, treat as plain text
        if (session.debug) {
          console.error(`[LLM] Failed to parse as Dirac, treating as text: ${parseError}`);
        }
        emit(session, result);
      }
    } else {
      // Otherwise emit to output as text
      emit(session, result);
    }
    
  } catch (error) {
    throw new Error(`LLM error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
