import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import Home from "../pages/Home";
import Projects from "../pages/Projects";
import Tutor from "../pages/Tutor";
import Login from "../pages/Login";
import Register from "../pages/Register";

const NotFound = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold">Página no encontrada</h2>
    <p className="text-slate-600">Revisa la URL.</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><Home /></Layout>,
  },
  {
    path: "/projects",
    element: <Layout><Projects /></Layout>,
  },
  {
    path: "/tutor",
    element: <Layout><Tutor /></Layout>,
  },
  {
    path: "/login",
    element: <Layout><Login /></Layout>,
  },
  {
    path: "/register",
    element: <Layout><Register /></Layout>,
  },
  { path: "*", element: <Layout><NotFound /></Layout> },
]);
