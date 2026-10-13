import { z } from "zod";

export const userStatusSchema = z.object({
  status: z.enum(["active", "blocked"]),
});

export const userRoleSchema = z.object({
  role: z.enum(["admin", "customer"]),
});

export const userQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),

  role: z.enum(["admin", "customer"]).optional(),

  status: z.enum(["active", "blocked"]).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
