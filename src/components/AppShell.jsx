import React from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import Dashboard from '../Dashboard';
import Runes from '../Runes';
import Scrolls from '../scrolls';
import Tags from '../Tags';
import Users from '../Users';

const navigationItems = isAdmin =>
  [
    { href: '/', label: 'Overview', exact: true },
    { href: '/runes', label: 'Runes' },
    { href: '/manage/scrolls', label: 'Scrolls' },
    { href: '/tags', label: 'Tags' },
    isAdmin ? { href: '/users', label: 'Users' } : null,
  ].filter(Boolean);

function navClassName({ isActive }) {
  return `site-nav-link${isActive ? ' is-active' : ''}`;
}

export default function AppShell() {
  const { isAdmin, logout, user } = useAuth();

  return (
    <div className="control-plane">
      <div className="control-plane__glow control-plane__glow--left" aria-hidden="true" />
      <div className="control-plane__glow control-plane__glow--right" aria-hidden="true" />

      <header className="site-header app-header">
        <NavLink className="site-brand app-brand" to="/">
          <span className="app-brand__mark">AL</span>
          <span className="app-brand__copy">
            <span className="app-brand__title">AccioLists</span>
            <span className="app-brand__subtitle">Rune inventory and scroll publication</span>
          </span>
        </NavLink>

        <nav className="site-nav app-nav" aria-label="Primary">
          {navigationItems(isAdmin).map(item => (
            <NavLink
              key={item.href}
              className={navClassName}
              end={item.exact}
              to={item.href}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-header__utility">
          <span className="app-user-badge">{user?.username || 'Authenticated user'}</span>
          <a
            className="site-nav-link"
            href="/api/docs"
            rel="noreferrer"
            target="_blank"
          >
            API docs
          </a>
          <button className="site-nav-link app-header__logout" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </header>

      <main className="app-shell">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/runes" element={<Runes />} />
          <Route path="/manage/scrolls" element={<Scrolls />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/users" element={isAdmin ? <Users /> : <Navigate replace to="/" />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}
