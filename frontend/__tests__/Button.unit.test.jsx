import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "../src/components/Button";

test("renderiza el texto del botón y ejecuta click", async () => {
  const user = userEvent.setup();
  const handleClick = jest.fn();
  
  render(<Button onClick={handleClick}>Click aquí</Button>);
  const btn = screen.getByRole("button", { name: /click aquí/i });
  await user.click(btn);
  expect(handleClick).toHaveBeenCalledTimes(1);
});
