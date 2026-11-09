import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormattedText, parseFormattedText } from "./formatted-text";

describe("parseFormattedText", () => {
  it("groups bullet and numbered lines into lists", () => {
    expect(parseFormattedText("Intro\n• one\n• two\n1. first\n2. second")).toEqual([
      { kind: "p", text: "Intro" },
      { kind: "ul", items: ["one", "two"] },
      { kind: "ol", items: ["first", "second"] },
    ]);
  });

  it("splits bullets typed on a single line", () => {
    expect(parseFormattedText("• one • two • three")).toEqual([
      { kind: "ul", items: ["one", "two", "three"] },
    ]);
  });

  it("keeps separate paragraphs and ignores blank lines", () => {
    expect(parseFormattedText("First line\r\n\r\nSecond line")).toEqual([
      { kind: "p", text: "First line" },
      { kind: "p", text: "Second line" },
    ]);
  });
});

describe("FormattedText", () => {
  it("renders each bullet as its own list item", () => {
    render(<FormattedText text={"• Delivered report\n• Trained 20 staff"} />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Delivered report",
      "Trained 20 staff",
    ]);
  });

  it("shows the fallback for empty text", () => {
    render(<FormattedText text="" fallback="Nothing yet" />);
    expect(screen.getByText("Nothing yet")).toBeTruthy();
  });
});
