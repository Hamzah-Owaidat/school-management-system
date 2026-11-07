import type {
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "@sms/contracts";
import type { Request, Response } from "express";
import type { EmailSender } from "../../core/email/index.js";
import { unauthenticated } from "../../core/errors.js";
import { sessionCookie } from "../../core/session-cookie.js";
import * as authService from "./auth.service.js";

export function createAuthController(emailSender: EmailSender) {
  return {
    async login(req: Request, res: Response): Promise<void> {
      // Already parsed and stripped by validate({ body: LoginRequestSchema }) in auth.routes.ts.
      const body = req.body as LoginRequest;
      const existingToken = sessionCookie.read(req);
      const result = await authService.login(body, {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        existingToken,
      });
      sessionCookie.set(res, result.token, result.expiresAt);
      res.status(200).json(result.body);
    },

    async logout(req: Request, res: Response): Promise<void> {
      const token = sessionCookie.read(req);
      if (token) await authService.logout(token);
      sessionCookie.clear(res);
      res.status(204).end();
    },

    async me(req: Request, res: Response): Promise<void> {
      if (!req.auth) throw unauthenticated();
      const body = await authService.getMe(req.auth);
      res.status(200).json(body);
    },

    async forgotPassword(req: Request, res: Response): Promise<void> {
      const body = req.body as ForgotPasswordRequest;
      await authService.forgotPassword(body.email, emailSender);
      res.status(202).json({ message: authService.FORGOT_PASSWORD_MESSAGE });
    },

    async resetPassword(req: Request, res: Response): Promise<void> {
      const body = req.body as ResetPasswordRequest;
      await authService.resetPassword(body.token, body.password, emailSender);
      res.status(204).end();
    },

    async requestEmailVerification(req: Request, res: Response): Promise<void> {
      if (!req.auth) throw unauthenticated();
      await authService.requestEmailVerification(req.auth.user, emailSender);
      res.status(202).json({ message: authService.EMAIL_VERIFICATION_REQUEST_MESSAGE });
    },

    async verifyEmail(req: Request, res: Response): Promise<void> {
      const body = req.body as VerifyEmailRequest;
      await authService.verifyEmail(body.token);
      res.status(204).end();
    },
  };
}
