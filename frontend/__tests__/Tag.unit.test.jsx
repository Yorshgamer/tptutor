import { render, screen } from "@testing-library/react";
import Tag from "../src/components/Tag";

test("Tag renderiza su contenido", () => {
  render(<Tag>Etiqueta</Tag>);
  expect(screen.getByText("Etiqueta")).toBeInTheDocument();
});
