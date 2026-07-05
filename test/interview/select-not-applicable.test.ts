import { describe, it, expect } from "vitest";
import { selectNotApplicable } from "@/lib/interview/select-not-applicable";

describe("selectNotApplicable", () => {
  it("a control without rule (null) always applies -> not in the list", () => {
    expect(
      selectNotApplicable([{ code: "A.1", appliesWhen: null }], [], {}),
    ).toEqual([]);
  });

  it("a control whose required factor is not declared by the company -> not applicable", () => {
    expect(
      selectNotApplicable(
        [{ code: "A.1", appliesWhen: { factors_any: ["sensitive_data"] } }],
        ["automated_decisions"],
        {},
      ),
    ).toEqual(["A.1"]);
  });

  it("a control whose required factor IS declared -> applies (not in the list)", () => {
    expect(
      selectNotApplicable(
        [{ code: "A.1", appliesWhen: { factors_any: ["sensitive_data"] } }],
        ["sensitive_data"],
        {},
      ),
    ).toEqual([]);
  });

  it("override true rescues a control the rule would exclude", () => {
    expect(
      selectNotApplicable(
        [{ code: "A.1", appliesWhen: { factors_any: ["sensitive_data"] } }],
        [],
        { "A.1": true },
      ),
    ).toEqual([]);
  });

  it("override false forces not_applicable even though the rule says it applies", () => {
    expect(
      selectNotApplicable([{ code: "A.1", appliesWhen: null }], [], {
        "A.1": false,
      }),
    ).toEqual(["A.1"]);
  });

  it("mixes several controls, preserving input order", () => {
    expect(
      selectNotApplicable(
        [
          { code: "A.1", appliesWhen: null },
          { code: "A.2", appliesWhen: { factors_any: ["sensitive_data"] } },
          { code: "A.3", appliesWhen: { factors_any: ["sensitive_data"] } },
        ],
        ["sensitive_data"],
        { "A.1": false },
      ),
    ).toEqual(["A.1"]);
  });

  it("empty catalog -> []", () => {
    expect(selectNotApplicable([], [], {})).toEqual([]);
  });
});
