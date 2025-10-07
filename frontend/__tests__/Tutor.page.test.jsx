import { render, screen } from "@testing-library/react";
import Tutor from "../src/pages/Tutor";

test("Tutor renderiza su contenido", () => {
  render(<Tutor />);
  expect(
    screen.getByText(/tutor|asistente|ayuda/i)
  ).toBeInTheDocument();
});
