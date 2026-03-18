declare module 'graphql-shield' {
  export type IRuleResult = boolean | string | Error;
  export interface IRule {
    resolve(parent: object, args: object, ctx: unknown, info: unknown, options: unknown): Promise<IRuleResult>;
  }
  export type ShieldRule = IRule;
  export function shield(rules: any, options?: any): any;
  export function rule(options?: any): (resolver: any) => IRule;
  export function and(...rules: ShieldRule[]): ShieldRule;
  export function allow(): ShieldRule;
  export function deny(): ShieldRule;
}
