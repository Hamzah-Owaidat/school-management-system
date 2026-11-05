import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { validationFailed } from "./errors.js";

export interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Parses body/query/params with Zod and replaces them with the parsed, stripped values,
 * so controllers only ever see typed, known fields. Unknown input never reaches a
 * controller — in particular a client-sent `schoolId` is dropped (threat T2), since no
 * module schema declares it: the tenant's schoolId always comes from the session.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        // req.query has no setter in Express 5 (it's a getter over the raw URL), so it
        // must be overridden via defineProperty rather than plain assignment.
        Object.defineProperty(req, "query", {
          value: schemas.query.parse(req.query),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          validationFailed(
            "Validation failed",
            error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
          ),
        );
        return;
      }
      next(error);
    }
  };
}
