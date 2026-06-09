# AI-Assisted Support Drafting

This project includes deterministic CX draft checks that model how AI could assist a production-support workflow without requiring an API key or making unsupported claims.

## What It Does

- Builds a customer-safe draft from confirmed SQL and mock vendor evidence.
- Applies guardrails for card authorization holds and ACH returns.
- Flags risky wording patterns, such as guarantee language.
- Keeps the final message grounded in synthetic evidence.

## What It Does Not Do

- It does not call an AI model.
- It does not generate or process real customer data.
- It does not claim to represent real payment network behavior.
- It does not make final customer-support decisions.

## Role Signal

The OnePay role emphasizes using AI to improve production support. This module shows the workflow shape: collect evidence first, draft second, run wording checks, then hand the result to CX or engineering.
