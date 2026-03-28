import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Setup } from "./pages/Setup";
import { CouncilRun } from "./pages/CouncilRun";
import { Layout } from "./components/Layout";
import "./styles.css";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "new",
        Component: Setup,
      },
      {
        path: "council/:id",
        Component: CouncilRun,
      },
    ],
  },
]);
