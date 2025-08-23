import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";

const NotFound = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold">Página no encontrada</h2>
    <p className="text-slate-600 dark:text-slate-300">Revisa la URL.</p>
  </div>
);

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "*", element: <NotFound /> },
]);