import { Logger } from "./InterviewAssistantTypes";

export const createLogger = (): Logger => {
  return {
    // @ts-ignore
    log: (...args: unknown[]) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        // console.log(...args);
      }
    },
    error: (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      console.error(...args);
    }
  };
};

export const logger = createLogger(); 