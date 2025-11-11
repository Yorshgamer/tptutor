import { render, screen } from "@testing-library/react";
import Register from "../src/pages/Register";

test("Register renderiza su contenido", () => {
  render(<Register />);
  expect(
    screen.getByText(/crear cuenta|registrarse|registro/i)
  ).toBeInTheDocument();
});
