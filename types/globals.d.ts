export {};

// Extend React's StyleHTMLAttributes to support styled-jsx attributes
declare module 'react' {
  interface StyleHTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}
