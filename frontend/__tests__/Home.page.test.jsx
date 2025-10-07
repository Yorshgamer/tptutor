import { render, screen } from "@testing-library/react";
import Home from "../src/pages/Home";

test("Home renderiza su encabezado/contenido", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { name: /bienvenido|home|inicio/i })
  ).toBeInTheDocument();
});
