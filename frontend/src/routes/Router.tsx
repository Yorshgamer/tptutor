import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import Home from "../pages/Home";
import Projects from "../pages/Projects";
import Tutor from "../pages/Tutor";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProtectedRoute from "../auth/ProtectedRoute";
import PublicOnlyRoute from "../auth/PublicOnlyRoute";

const NotFound = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold">Página no encontrada</h2>
    <p className="text-slate-600">Revisa la URL.</p>
  </div>
);

export const router = createBrowserRouter([
  // rutas públicas
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <Layout />
      </PublicOnlyRoute>
    ),
    children: [{ index: true, element: <Login /> }],
  },
  {
    path: "/register",
    element: (
      <PublicOnlyRoute>
        <Layout />
      </PublicOnlyRoute>
    ),
    children: [{ index: true, element: <Register /> }],
  },

  // rutas protegidas
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <Home /> },
          { path: "/projects", element: <Projects /> },
          { path: "/tutor", element: <Tutor /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
