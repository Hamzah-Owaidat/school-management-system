import { OpenApiGeneratorV31, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { ErrorResponseSchema } from "@sms/contracts";

/**
 * Shared across every module: each module's routes.ts registers its own paths here
 * (see apps/api/README.md, "Adding a new endpoint") so this file never needs editing.
 *
 * Schemas are passed inline rather than through `registry.register()`: that helper needs
 * `extendZodWithOpenApi()` to patch `ZodType.prototype.openapi`, which doesn't reach
 * instances built from this project's Zod 4 (ESM) build, so every module repeats
 * `ErrorResponseSchema` directly instead of referencing a shared $ref.
 */
export const openApiRegistry = new OpenAPIRegistry();

export { ErrorResponseSchema };

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(openApiRegistry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: { title: "School Management System API", version: "0.1.0" },
  });
}
