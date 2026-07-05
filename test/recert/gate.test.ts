import { describe, expect, it } from "vitest";
import { recertGate } from "../../lib/recert/gate";

describe("recertGate", () => {
  it("routes 'low' tier to self_service_pending", () => {
    expect(recertGate("low")).toBe("self_service_pending");
  });

  it.each(["medium", "high", "critical"] as const)(
    "routes '%s' tier to consultant_review",
    (tier) => {
      expect(recertGate(tier)).toBe("consultant_review");
    },
  );
});
