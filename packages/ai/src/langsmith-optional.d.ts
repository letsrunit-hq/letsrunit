declare module 'langsmith/experimental/vercel' {
  import type * as ai from 'ai';

  export function wrapAISDK(sdk: typeof ai): {
    generateText: typeof ai.generateText;
    generateObject: typeof ai.generateObject;
  };
}
