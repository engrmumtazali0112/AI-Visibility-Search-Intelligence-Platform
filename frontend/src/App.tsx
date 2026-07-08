import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CreateProfile from "./pages/CreateProfile";
import ProfileDetail from "./pages/ProfileDetail";
import QueriesView from "./pages/QueriesView";
import RecommendationsView from "./pages/RecommendationsView";
import RunHistory from "./pages/RunHistory";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profiles/new" element={<CreateProfile />} />
        <Route path="/profiles/:profileUuid" element={<ProfileDetail />} />
        <Route path="/profiles/:profileUuid/queries" element={<QueriesView />} />
        <Route path="/profiles/:profileUuid/recommendations" element={<RecommendationsView />} />
        <Route path="/profiles/:profileUuid/runs" element={<RunHistory />} />
      </Routes>
    </Layout>
  );
}
