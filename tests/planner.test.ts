import { describe, expect, it } from "vitest";
import { planFromMarkdown } from "../src/agent/planner.js";

describe("planFromMarkdown", () => {
  it("builds header, release section, and footer from structured markdown", () => {
    const markdown = `
# Subject
Digital Dealer Update

# Intro
Quick highlights for this sprint.

# Edition
March 2026

# Disclaimer
Preview visuals only.

# Upcoming releases

## 4. Slot planner refresh
- Kicker: Improve planning speed.
- Body: Faster slot matching with clearer statuses.
- Image: https://example.com/slot.jpg
- Alt: Slot planner timeline UI
- Links: [Read notes](https://example.com/notes), [Watch demo](https://example.com/demo)
`;

    const plan = planFromMarkdown(markdown);
    expect(plan.header.subject).toBe("Digital Dealer Update");
    expect(plan.header.intro).toBe("Quick highlights for this sprint.");
    expect(plan.header.edition).toBe("March 2026");
    expect(plan.featureSection.title).toBe("Upcoming releases");
    expect(plan.featureSection.disclaimer).toBe("Preview visuals only.");
    expect(plan.featureSection.items).toHaveLength(1);
    expect(plan.featureSection.items[0].number).toBe(1);
    expect(plan.featureSection.items[0].title).toBe("Slot planner refresh");
    expect(plan.featureSection.items[0].links[0].label).toBe("Read notes");
  });
});

