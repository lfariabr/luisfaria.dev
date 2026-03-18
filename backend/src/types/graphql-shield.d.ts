declare module 'graphql-shield' {
    export interface Rule {
      resolve(parent: unknown, args: unknown, context: unknown, info: unknown): Promise<boolean | Error>;
    }
    export function shield(rules: any, options?: any): any;
    export function rule(options?: any): (resolver: any) => Rule;
    export function allow(): any;
    export function deny(): any;
  }