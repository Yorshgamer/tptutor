// __tests__/Projects.page.test.jsx
import { render, screen } from "@testing-library/react";
import Projects from "../src/pages/Projects";

test("Projects renderiza su encabezado principal", () => {
  render(<Projects />);
  // El h3 "Proyectos" aparece como heading accesible
  expect(screen.getByRole("heading", { name: /proyectos/i })).toBeInTheDocument();
});
