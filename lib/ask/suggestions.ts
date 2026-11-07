/* Starter questions shown in an empty Ask panel. tests/ask-retrieval.test.ts checks that every one
   of them finds a passage, so a chip never leads to "I don't have that". */
export const askSuggestions = [
  "What is SyncBoard?",
  "How does SyncBoard keep tenants apart?",
  "What is he learning right now?",
  "How can I contact him?",
] as const
