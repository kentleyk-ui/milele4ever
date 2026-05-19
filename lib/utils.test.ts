import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merge les classes Tailwind correctement", () => {
    expect(cn("p-2", "p-4", "text-sm")).toBe("p-4 text-sm");
  });

  it("ignore les valeurs falsy", () => {
    expect(cn("block", false && "hidden", undefined, null, "mt-2")).toBe("block mt-2");
  });
});
