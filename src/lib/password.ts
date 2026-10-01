export type PasswordRuleId = "minLength" | "number" | "symbol";

export function evaluatePassword(password: string): Record<PasswordRuleId, boolean> {
  return {
    minLength: password.length >= 10,
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const result = evaluatePassword(password);
  return result.minLength && result.number && result.symbol;
}
