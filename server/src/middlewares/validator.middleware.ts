
import type { Request, Response, NextFunction } from "express";
import type { AnyZodObject } from "zod";
import { ApiError } from "../utils/apiError";

export const validate = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      const extractedErrors = error.errors.map((err: any) => ({
        [err.path.join('.')]: err.message
      }));
      throw new ApiError(422, "Received data is not valid", extractedErrors);
    }
  };
};
