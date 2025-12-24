/// <reference types="vite/client" />

declare module '*.pegjs?raw' {
  const content: string
  export default content
}
