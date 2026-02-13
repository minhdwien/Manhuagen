// Removed vite/client reference as it was causing lookup errors in the environment.
// Ensure process.env.API_KEY is typed.

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}