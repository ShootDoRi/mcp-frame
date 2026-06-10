export interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

export interface SafeParseFailure {
  success: false;
  error: unknown;
}

export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

export interface SafeParseSchema<T> {
  safeParse(value: unknown): SafeParseResult<T>;
}

export interface ValidationResult<T> {
  data?: T;
  error?: unknown;
}

export function validateWithSchema<T>(
  value: unknown,
  schema?: SafeParseSchema<T>
): ValidationResult<T> {
  if (!schema) {
    return { data: value as T };
  }

  const result = schema.safeParse(value);
  if (result.success) {
    return { data: result.data };
  }

  return { error: result.error };
}
