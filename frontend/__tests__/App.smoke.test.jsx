// __tests__/App.smoke.test.jsx
import { render, screen } from "@testing-library/react";
import App from "../src/App";

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    RouterProvider: ({ router }) => (
      <div data-testid="mock-router">RouterProvider Mocked</div>
    ),
  };
});

describe("✅ App Component", () => {
  test("renderiza sin errores y muestra el RouterProvider", () => {
    render(<App />);
    expect(screen.getByTestId("mock-router")).toBeInTheDocument();
  });
});
