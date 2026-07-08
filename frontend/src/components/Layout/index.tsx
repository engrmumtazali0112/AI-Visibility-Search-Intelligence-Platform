import type { ReactNode } from "react";
import { NavLink, useParams } from "react-router-dom";

const navItem =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-primary-light hover:text-primary-dark";
const navItemActive = "bg-primary-light text-primary-dark";

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { profileUuid } = useParams();

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 2 3 7l9 5 9-5-9-5Zm-9 8 9 5 9-5M3 15l9 5 9-5" opacity="0" />
                <path d="M4 12a8 8 0 1 1 8 8 1 1 0 0 1 0-2 6 6 0 1 0-6-6 1 1 0 0 1-2 0Z" />
                <circle cx="12" cy="12" r="2.4" />
              </svg>
            </div>
            <span className="font-display text-[15px] font-bold text-ink">AI Visibility</span>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            <NavLink to="/" end className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}>
              <Icon path="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
              Dashboard
            </NavLink>
            <NavLink to="/profiles/new" className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}>
              <Icon path="M12 5v14M5 12h14" />
              New profile
            </NavLink>

            {profileUuid && (
              <>
                <div className="mt-5 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted/70">
                  This profile
                </div>
                <NavLink
                  to={`/profiles/${profileUuid}`}
                  end
                  className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}
                >
                  <Icon path="M4 4h16v4H4zM4 10h10v10H4zM16 10h4v10h-4z" />
                  Overview
                </NavLink>
                <NavLink
                  to={`/profiles/${profileUuid}/queries`}
                  className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}
                >
                  <Icon path="M4 6h16M4 12h10M4 18h7" />
                  Queries
                </NavLink>
                <NavLink
                  to={`/profiles/${profileUuid}/recommendations`}
                  className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}
                >
                  <Icon path="M12 3 4 21h16L12 3ZM12 10v5" />
                  Recommendations
                </NavLink>
                <NavLink
                  to={`/profiles/${profileUuid}/runs`}
                  className={({ isActive }) => `${navItem} ${isActive ? navItemActive : ""}`}
                >
                  <Icon path="M4 19V5m0 14h16M8 15l3-3 2 2 4-5" />
                  Run history
                </NavLink>
              </>
            )}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-6 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  );
}
