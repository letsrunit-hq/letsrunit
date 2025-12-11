import { describe, expect, it } from "vitest";
import { run } from "../run";

describe('action run', () => {
  it('returns ok: true', async () => {
    const res = await run();
    expect(res).toEqual({ ok: true });
  });
});
