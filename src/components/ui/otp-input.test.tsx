import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpInput } from "@/components/ui/otp-input";
import { useState } from "react";

function Harness() {
  const [value, setValue] = useState("");
  return (
    <div>
      <OtpInput value={value} onChange={setValue} />
      <output data-testid="otp-value">{value}</output>
    </div>
  );
}

describe("OtpInput", () => {
  it("auto-advances and supports paste", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const first = screen.getByLabelText("Digit 1");
    await user.type(first, "4");
    expect(screen.getByTestId("otp-value")).toHaveTextContent("4");

    await user.click(first);
    await user.paste("482913");
    expect(screen.getByTestId("otp-value")).toHaveTextContent("482913");
  });
});
