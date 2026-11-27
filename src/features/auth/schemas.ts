import { z } from 'zod';

export const PASSWORD_MIN = 8;
export const NAME_MAX = 60;

// Messages are i18n keys in the "auth" namespace; forms translate them when rendering.
export const emailSchema = z.string().trim().email('validation.emailInvalid');
export const passwordSchema = z.string().min(PASSWORD_MIN, 'validation.passwordMin');
export const nameSchema = z
  .string()
  .trim()
  .min(1, 'validation.nameRequired')
  .max(NAME_MAX, 'validation.nameMax');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'validation.passwordMin'),
});
export const signUpSchema = z.object({
  displayName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export const forgotSchema = z.object({ email: emailSchema });
export const resetSchema = z.object({ password: passwordSchema });
