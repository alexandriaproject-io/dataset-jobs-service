export const safeJsonParse = <T>(jsonString: string): T | null => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return null;
  }
};

export enum SUPPORTED_TOOLS {
  DEFAULT = 'default',
  GPT4_1106_PREVIEW = 'gpt-4-1106-preview',
  GPT4_0613 = 'gpt-4-0613',
  GPT4_0314 = 'gpt-4-0314',
  GPT4 = 'gpt-4',
  GPT3_5_TURBO_16K_0613 = 'gpt-3.5-turbo-16k-0613',
  GPT3_5_TURBO_16K = 'gpt-3.5-turbo-16k',
  GPT3_5_TURBO_1106 = 'gpt-3.5-turbo-1106',
  GPT3_5_TURBO_0613 = 'gpt-3.5-turbo-0613',
  GPT3_5_TURBO_0301 = 'gpt-3.5-turbo-0301',
  GPT3_5_TURBO = 'gpt-3.5-turbo',
  UNKNOWN = 'unknown',
}

// ['default', 'gpt-4-1106-preview', 'gpt-4-0613', 'gpt-4-0314', 'gpt-4', 'gpt-3.5-turbo-16k-0613', 'gpt-3.5-turbo-16k', 'gpt-3.5-turbo-1106', 'gpt-3.5-turbo-0613', 'gpt-3.5-turbo-0301', 'gpt-3.5-turbo']
