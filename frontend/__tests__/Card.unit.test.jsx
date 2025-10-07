// __tests__/Card.unit.test.jsx
import { render, screen } from "@testing-library/react";
import Card from "../src/components/Card";

describe("✅ Card Component", () => {
  test("renderiza correctamente sin título ni subtítulo", () => {
    render(<Card>Contenido</Card>);
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  test("renderiza con título", () => {
    render(<Card title="Mi Título">Texto</Card>);
    expect(screen.getByText("Mi Título")).toBeInTheDocument();
    expect(screen.getByText("Texto")).toBeInTheDocument();
  });

  test("renderiza con subtítulo", () => {
    render(<Card subtitle="Subtitulo de prueba">Contenido</Card>);
    expect(screen.getByText("Subtitulo de prueba")).toBeInTheDocument();
  });

  test("renderiza con título y subtítulo simultáneamente", () => {
    render(<Card title="Título Principal" subtitle="Subtitulo Secundario">Cuerpo</Card>);
    expect(screen.getByText("Título Principal")).toBeInTheDocument();
    expect(screen.getByText("Subtitulo Secundario")).toBeInTheDocument();
    expect(screen.getByText("Cuerpo")).toBeInTheDocument();
  });
});
