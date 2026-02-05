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
    throw new Error('<LLM> requires API key (set OPENAI_API_KEY, ANTHROPIC_API_KEY, or LLM_PROVIDER=ollama in .env file)');
  }

  // Check limits
  if (session.limits.currentLLMCalls >= session.limits.maxLLMCalls) {
    throw new Error('Maximum LLM calls exceeded');
  }

  session.limits.currentLLMCalls++;

  // Detect provider from client type
  const providerName = session.llmClient.constructor.name;
  const isOpenAI = providerName === 'OpenAI';
  const isOllama = providerName === 'OllamaProvider';
  const defaultModel = isOpenAI
    ? 'gpt-4.1-2025-04-14'
    : isOllama
      ? 'llama2'
      : 'claude-sonnet-4-20250514';


  const model = element.attributes.model || process.env.DEFAULT_MODEL || defaultModel;

  const outputVar = element.attributes.output;
  const contextVar = element.attributes.context;
  const executeMode = element.attributes.execute === 'true'; // NEW: seamless execution mode
  const temperature = parseFloat(element.attributes.temperature || '1.0');
  const maxTokens = parseInt(element.attributes.maxTokens || '4096', 10);

  // Build prompt from children or text
  let userPrompt = '';
  if (element.children.length > 0) {
    // Execute children to build prompt
    const beforeOutput = session.output.length;
    for (const child of element.children) {
      await integrate(session, child);
    }
    // Collect output from children
    const childOutput = session.output.slice(beforeOutput);
    userPrompt = childOutput.join('').trim();
    // Remove child output from main output
    session.output = session.output.slice(0, beforeOutput);
  } else if (element.text) {
    userPrompt = substituteVariables(session, element.text).trim();
  } else {
    throw new Error('<LLM> requires prompt content');
  }

  // FIFO dialog history support
  let dialogHistory = [];
  if (contextVar) {
    const existing = getVariable(session, contextVar);
    if (Array.isArray(existing)) {
      dialogHistory = [...existing];
    } else if (existing) {
      // If context is a string, treat as system message
      dialogHistory = [{ role: 'system', content: String(existing) }];
    }
  }

  const noExtra = element.attributes.noextra === 'true';
  let prompt: string;
  let systemPrompt = '';
  if (noExtra) {
    prompt = userPrompt;
    if (session.debug || process.env.DIRAC_LOG_PROMPT === '1') {
      console.error('[LLM] Full prompt sent to LLM (noextra):\n' + prompt + '\n');
    }
  } else {
    // Reflect subroutines for system prompt
    const { getAvailableSubroutines } = await import('../runtime/session.js');
    const subroutines = getAvailableSubroutines(session);
    if (session.debug) {
      console.error('[LLM] Subroutines available at prompt composition:',
        subroutines.map(s => ({ name: s.name, description: s.description, parameters: s.parameters })));
    }
    systemPrompt = `Dirac is a XML based language, you define the subroutine like
\`\`\`xml
<subroutine name=background param-color="string">
 <paint_the_color_somewhere />
</subroutine>
\`\`\`
then you call it like
\`\`\`xml
<background color="blue" />
\`\`\`
`;
    systemPrompt += 'Now, You are an expert Dirac XML code generator.\nAllowed Dirac XML tags (use ONLY these tags):';
for (const sub of subroutines) {
  systemPrompt += `\n- ${sub.name} : ${sub.description || ''}`;
  systemPrompt += `\n\tEx: <${sub.name}`;
  if (sub.parameters && sub.parameters.length > 0) {
    for (const p of sub.parameters) {
      systemPrompt += ` ${p.name}="${p.example || 'string'}"`;
    }
  }
  let example = sub.meta?.body?.example || '';
   example = example.replace(/&quot;/g, '"').replace(/&#58;/g, ':'); 
  systemPrompt += '>'+example+'</' + sub.name + '>';
}
    systemPrompt += '\nDo NOT invent or use any tags not listed above. For example, do NOT use <changeBackground> or <set-background>. Only use the allowed tags.\nInstructions: Output only valid Dirac XML tags from the list above. Do not include explanations or extra text.';
    systemPrompt += '\nAfter generating your answer, check the command/tag list again and ensure every tag you use is in the list above. If any tag is not in the list, do not output it—regenerate your answer using only allowed tags.';

    prompt = systemPrompt + '\nUser: ' + userPrompt + '\nOutput:';
    if (session.debug || process.env.DIRAC_LOG_PROMPT === '1') {
      console.error('[LLM] Full prompt sent to LLM:\n' + prompt + '\n');
    }
  }

  // Add the full prompt as a user message to dialogHistory
  dialogHistory.push({ role: 'user', content: noExtra ? userPrompt : prompt });
  
  if (session.debug) {
    console.error(`[LLM] Calling ${model} with prompt length: ${prompt.length}`);
    console.error(`[LLM] Dialog history length: ${dialogHistory.length} messages`);
  }
  
  try {
    let result: string;
    if (isOpenAI) {
      // Call OpenAI API with full dialog history
      const response = await session.llmClient.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: dialogHistory,
      });
      result = response.choices[0]?.message?.content || '';
    } else if (isOllama) {
      // Call OllamaProvider with dialog history as joined string
      const ollamaPrompt = dialogHistory.map(m => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`).join('\n');
      result = await session.llmClient.complete(ollamaPrompt, {
        model,
        temperature,
        max_tokens: maxTokens,
      });
    } else {
      // Call Anthropic API with full dialog history
      const response = await session.llmClient.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: dialogHistory,
      });
      const content = response.content[0];
      result = content.type === 'text' ? content.text : '';
    }
    
    if (session.debug) {
      console.error(`[LLM] Response length: ${result.length}`);
    }
    
    // After LLM call, append assistant response to dialogHistory and update context variable
    if (contextVar) {
      dialogHistory.push({ role: 'assistant', content: result });
      setVariable(session, contextVar, dialogHistory, true);
    }

    // Store in variable if requested
    if (outputVar) {
      setVariable(session, outputVar, result, false);
    } else if (executeMode) {
      // NEW: Execute mode - parse and interpret LLM response as Dirac code
      const validateTags = element.attributes['validate'] === 'true';
      const autocorrect = element.attributes['autocorrect'] === 'true';
      const maxRetries = parseInt(element.attributes['max-retries'] || '0', 10);
      
      if (session.debug) {
        console.error(`[LLM] Executing response as Dirac code:\n${result}\n`);
        if (validateTags) {
          console.error(`[LLM] Tag validation enabled (autocorrect: ${autocorrect}, max-retries: ${maxRetries})`);
        }
      }

      // Only replace triple backtick code blocks if replace-tick="true" is set
      const replaceTick = element.attributes['replace-tick'] === 'true';
      let diracCode = result.trim();
      if (replaceTick && diracCode.startsWith('```')) {
        // Check for bash, xml, html, dirac, or no language
        const match = diracCode.match(/^```(\w+)?\n?/m);
        if (match && match[1] === 'bash') {
          // Find closing triple backticks
          const endIdx = diracCode.indexOf('```', 3);
          let bashContent = diracCode.slice(match[0].length, endIdx).trim();
          diracCode = `<system>${bashContent}</system>`;
        } else {
          // Remove opening and closing backticks for xml/html/dirac/none
          diracCode = diracCode.replace(/^```(?:xml|html|dirac)?\n?/m, '').replace(/\n?```$/m, '').trim();
        }
      }
      
      try {
        // Parse the LLM's output as Dirac code
        const parser = new DiracParser();
        let dynamicAST = parser.parse(diracCode);
        
        // Validate tags if requested
        if (validateTags) {
          const { validateDiracCode, applyCorrectedTags } = await import('../utils/tag-validator.js');
          let validation = await validateDiracCode(session, dynamicAST, { autocorrect });
          let retryCount = 0;
          
          while (!validation.valid && retryCount < maxRetries) {
            retryCount++;
            if (session.debug) {
              console.error(`[LLM] Validation failed (attempt ${retryCount}/${maxRetries}):`, validation.errorMessages);
            }
            
            // Build error feedback for LLM
            const errorFeedback = validation.errorMessages.join('\n');
            const retryPrompt = `Your previous response had the following errors:\n${errorFeedback}\n\nPlease fix these errors and generate valid Dirac XML again. Remember to only use the allowed tags.`;
            
            // Add error feedback to dialog history
            dialogHistory.push({ role: 'user', content: retryPrompt });
            
            // Retry LLM call
            if (isOpenAI) {
              const response = await session.llmClient.chat.completions.create({
                model,
                max_tokens: maxTokens,
                temperature,
                messages: dialogHistory,
              });
              result = response.choices[0]?.message?.content || '';
            } else if (isOllama) {
              const ollamaPrompt = dialogHistory.map(m => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`).join('\n');
              result = await session.llmClient.complete(ollamaPrompt, {
                model,
                temperature,
                max_tokens: maxTokens,
              });
            } else {
              const response = await session.llmClient.messages.create({
                model,
                max_tokens: maxTokens,
                temperature,
                messages: dialogHistory,
              });
              const content = response.content[0];
              result = content.type === 'text' ? content.text : '';
            }
            
            // Add new response to dialog history
            dialogHistory.push({ role: 'assistant', content: result });
            
            // Update context variable if present
            if (contextVar) {
              setVariable(session, contextVar, dialogHistory, true);
            }
            
            if (session.debug) {
              console.error(`[LLM] Retry ${retryCount} response:\n${result}\n`);
            }
            
            // Clean up and parse the new response
            diracCode = result.trim();
            if (replaceTick && diracCode.startsWith('```')) {
              const match = diracCode.match(/^```(\w+)?\n?/m);
              if (match && match[1] === 'bash') {
                const endIdx = diracCode.indexOf('```', 3);
                let bashContent = diracCode.slice(match[0].length, endIdx).trim();
                diracCode = `<system>${bashContent}</system>`;
              } else {
                diracCode = diracCode.replace(/^```(?:xml|html|dirac)?\n?/m, '').replace(/\n?```$/m, '').trim();
              }
            }
            
            dynamicAST = parser.parse(diracCode);
            validation = await validateDiracCode(session, dynamicAST, { autocorrect });
          }
          
          if (!validation.valid) {
            throw new Error(`Tag validation failed after ${maxRetries} retries:\n${validation.errorMessages.join('\n')}`);
          }
          
          // Apply auto-corrections if enabled
          if (autocorrect) {
            dynamicAST = applyCorrectedTags(dynamicAST, validation.results);
            if (session.debug) {
              console.error('[LLM] Applied auto-corrections to tags');
            }
          }
        }
        
        // Execute the validated (and possibly corrected) code
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


