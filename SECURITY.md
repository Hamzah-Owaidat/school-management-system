# Security Policy

This is a private project that will hold student and family data.

## Reporting a problem

Do not open a public issue for a security problem. Email hamzah@lebify.dev with the details and steps to reproduce.

## Rules for this repository

- Never commit secrets, tokens, passwords or real student data.
- Use `.env` files locally. Only `.env.example` is committed.
- Production and staging secrets live in GitHub Environments or the hosting provider, never in code.
