/// <reference types="vite/client" />

declare module '*.css' {
}

declare module '*.module.css' {
  export const styles: { readonly [className: string]: string };
}