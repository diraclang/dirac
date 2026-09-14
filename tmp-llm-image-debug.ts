import { createSession } from './src/runtime/session.ts';
import { executeLLM } from './src/tags/llm.ts';
import { OllamaProvider } from './src/llm/ollama.ts';

(async () => {
  const realFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string, init: any) => {
    if (String(url).includes('/api/generate')) {
      const body = JSON.parse(init.body as string);
      console.log('hasImages', !!body.images, 'count', body.images?.length ?? 0);
      console.log('model', body.model);
      console.log('prompt', body.prompt);
      const image = body.images?.[0] ?? '';
      console.log('imagePrefix', image.slice(0, 40));
      console.log('imageLength', image.length);
      return new Response(JSON.stringify({ response: 'ok' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return realFetch(url, init);
  };

  const session = createSession({ llmProvider: 'ollama', llmModel: 'llava' });
  session.llmClient = new OllamaProvider({ model: 'llava' });

  const element = {
    tag: 'llm',
    attributes: { provider: 'ollama', model: 'llava', noextra: 'true', image: './IMG_4678.png' },
    children: [{ tag: '', text: 'describe what is in the image', attributes: {}, children: [] }],
    text: '',
  } as any;

  try {
    const out = await executeLLM(session, element);
    console.log('RESULT', out);
  } catch (e) {
    console.error('ERROR', e);
  }
})();
