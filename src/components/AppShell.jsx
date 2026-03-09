import React, { useState } from 'react';
import {
  AppLayout,
  BreadcrumbGroup,
  SideNavigation,
  TopNavigation,
} from '@cloudscape-design/components';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from '../Dashboard';
import Runes from '../Runes';
import Scrolls from '../scrolls';
import Tags from '../Tags';

const navigationItems = [
  {
    type: 'section',
    text: 'Workspace',
    items: [
      { type: 'link', text: 'Overview', href: '/' },
      { type: 'link', text: 'Runes', href: '/runes' },
      { type: 'link', text: 'Scrolls', href: '/manage/scrolls' },
      { type: 'link', text: 'Tags', href: '/tags' },
    ],
  },
];

const routeMetadata = {
  '/': {
    title: 'Overview',
  },
  '/runes': {
    title: 'Runes',
  },
  '/manage/scrolls': {
    title: 'Scrolls',
  },
  '/tags': {
    title: 'Tags',
  },
};

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(true);

  const activeHref =
    location.pathname.startsWith('/manage/scrolls') ? '/manage/scrolls' : location.pathname;

  const handleFollow = event => {
    const href = event.detail?.href;

    if (!href) {
      return;
    }

    event.preventDefault();
    navigate(href);
  };

  const breadcrumbItems =
    activeHref === '/'
      ? [{ text: 'Overview', href: '/' }]
      : [
          { text: 'Overview', href: '/' },
          {
            text: routeMetadata[activeHref]?.title || 'Workspace',
            href: activeHref,
          },
        ];

  return (
    <div className="acciolists-root">
      <div id="acciolists-top-nav">
        <TopNavigation
          identity={{
            href: '/',
            title: 'AccioLists',
            onFollow: handleFollow,
          }}
          utilities={[
            {
              type: 'button',
              text: 'API docs',
              iconName: 'external',
              href: '/api/docs',
              external: true,
              externalIconAriaLabel: 'Opens the API docs in a new tab',
            },
          ]}
          i18nStrings={{
            overflowMenuBackIconAriaLabel: 'Back',
            overflowMenuDismissIconAriaLabel: 'Close menu',
            overflowMenuTitleText: 'All navigation',
            overflowMenuTriggerText: 'Open navigation menu',
          }}
        />
      </div>
      <div className="acciolists-layout">
        <AppLayout
          headerSelector="#acciolists-top-nav"
          contentType="default"
          navigationOpen={navigationOpen}
          onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
          navigation={
            <SideNavigation
              activeHref={activeHref}
              header={{
                href: '/',
                text: 'AccioLists',
              }}
              items={navigationItems}
              onFollow={handleFollow}
            />
          }
          breadcrumbs={<BreadcrumbGroup items={breadcrumbItems} onFollow={handleFollow} />}
          toolsHide
          maxContentWidth={Number.MAX_VALUE}
          content={
            <div className="acciolists-page">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/runes" element={<Runes />} />
                <Route path="/manage/scrolls" element={<Scrolls />} />
                <Route path="/tags" element={<Tags />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </div>
          }
        />
      </div>
    </div>
  );
}
