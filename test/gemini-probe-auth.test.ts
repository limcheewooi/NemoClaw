// @ts-nocheck
// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { getProbeAuthMode } from "../dist/lib/onboard";

// Fork override of upstream #1960: upstream sent ?key= query-param for
// gemini-api to avoid dual-auth rejection, but the fork's Gemini target
// (OpenAI-compat endpoint /v1beta/openai/) requires Bearer. getProbeAuthMode
// is now a no-op — always returns undefined — so the default Bearer flow
// handles every provider including gemini-api.
describe("getProbeAuthMode (fork override of #1960)", () => {
  it("returns undefined for gemini-api (was 'query-param' upstream)", () => {
    expect(getProbeAuthMode("gemini-api")).toBeUndefined();
  });

  it("returns undefined for every other provider", () => {
    expect(getProbeAuthMode("openai-api")).toBeUndefined();
    expect(getProbeAuthMode("nvidia-prod")).toBeUndefined();
    expect(getProbeAuthMode("anthropic-prod")).toBeUndefined();
    expect(getProbeAuthMode("compatible-endpoint")).toBeUndefined();
    expect(getProbeAuthMode("")).toBeUndefined();
  });
});

describe("compiled onboard.js no longer pairs gemini-api with query-param auth", () => {
  const onboardSrc = fs.readFileSync(
    path.join(import.meta.dirname, "..", "dist", "lib", "onboard.js"),
    "utf-8",
  );

  it("does not contain a gemini-api → query-param mapping", () => {
    expect(onboardSrc).not.toMatch(/gemini-api.*query-param|query-param.*gemini-api/);
  });
});
