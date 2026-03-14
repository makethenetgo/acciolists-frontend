import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from './lib/api';
import { Button, FlashMessages, PageHero, Panel } from './components/ui';

const emptyCounts = {
  ip: 0,
  url: 0,
  domain: 0,
  tags: 0,
  scrolls: 0,
};

export default function Dashboard() {
  const [counts, setCounts] = useState(emptyCounts);
  const [firstScrollName, setFirstScrollName] = useState('');
  const [loading, setLoading] = useState(true);
  const [flashItems, setFlashItems] = useState([]);

  const totalRunes = counts.ip + counts.url + counts.domain;
  const metricCards = [
    {
      label: 'All runes',
      value: totalRunes,
      detail: 'Combined IP, URL, and domain inventory',
    },
    {
      label: 'IP runes',
      value: counts.ip,
      detail: 'Network entries ready for publication',
    },
    {
      label: 'URL runes',
      value: counts.url,
      detail: 'Web destinations tracked in the control plane',
    },
    {
      label: 'Domain runes',
      value: counts.domain,
      detail: 'Domain indicators available to scroll builders',
    },
    {
      label: 'Tags',
      value: counts.tags,
      detail: 'Classification labels and color tokens',
    },
    {
      label: 'Scrolls',
      value: counts.scrolls,
      detail: 'Published artifacts available at the edge',
    },
  ];

  const loadCounts = async () => {
    setLoading(true);

    try {
      const [ipResponse, urlResponse, domainResponse, tagsResponse, scrollsResponse] =
        await Promise.all([
          api.get('/api/runes/ip'),
          api.get('/api/runes/url'),
          api.get('/api/runes/domain'),
          api.get('/api/tags'),
          api.get('/api/scrolls'),
        ]);

      const scrolls = scrollsResponse.data || [];

      setCounts({
        ip: ipResponse.data.length,
        url: urlResponse.data.length,
        domain: domainResponse.data.length,
        tags: tagsResponse.data.length,
        scrolls: scrolls.length,
      });
      setFirstScrollName(scrolls[0]?.name || '');
      setFlashItems([]);
    } catch (error) {
      setFlashItems([
        {
          id: 'dashboard-load-error',
          type: 'error',
          header: 'Unable to load dashboard metrics',
          content: getErrorMessage(error, 'The control plane could not fetch current counts.'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  return (
    <div className="page-stack">
      <PageHero
        actions={
          <Button loading={loading} onClick={loadCounts} variant="primary">
            Refresh workspace
          </Button>
        }
        description="Operate rune inventory, tag taxonomy, and published scroll artifacts from one surface built for fast reads and low-friction edits."
        eyebrow="AccioLists control plane"
      >
        <div className="hero-note-list">
          <span className="hero-note">Fresh counts from the API</span>
          <span className="hero-note">Published artifacts stay available at the edge</span>
        </div>
      </PageHero>

      <FlashMessages items={flashItems} />

      <section className="metric-grid">
        {metricCards.map(metric => (
          <article key={metric.label} className="metric-card">
            <p className="panel-kicker">{metric.label}</p>
            <p className="metric-card__value">{loading ? '...' : metric.value}</p>
            <p className="metric-card__detail">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="page-grid page-grid--three">
        <Panel
          copy="High-level status of the parts that matter when you are validating the local cluster or a new deploy."
          kicker="Posture"
          title="Platform readout"
        >
          <div className="status-list">
            <div className="status-row">
              <span className={`status-pill ${loading ? 'is-warn' : 'is-ready'}`}>
                {loading ? 'Loading' : 'Connected'}
              </span>
              <div>
                <h3>UI to API path</h3>
                <p>Direct CRUD actions flow through the ingress to the FastAPI surface.</p>
              </div>
            </div>
            <div className="status-row">
              <span className={`status-pill ${counts.scrolls > 0 ? 'is-ready' : 'is-idle'}`}>
                {counts.scrolls > 0 ? 'Published' : 'Empty'}
              </span>
              <div>
                <h3>Artifact edge</h3>
                <p>
                  Scroll artifacts are served independently of the API once the generator has written them.
                </p>
              </div>
            </div>
            <div className="status-row">
              <span className={`status-pill ${counts.tags > 0 ? 'is-ready' : 'is-idle'}`}>
                {counts.tags > 0 ? 'Ready' : 'Needs setup'}
              </span>
              <div>
                <h3>Tag taxonomy</h3>
                <p>
                  Tags drive both rune grouping and scroll inclusion logic, so empty tag sets slow everything else down.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          copy="Jump to the areas you are most likely to use while learning or debugging the app."
          kicker="Quick paths"
          title="Common next moves"
        >
          <div className="action-stack">
            <Link className="inline-action" to="/runes">
              Open rune inventory
            </Link>
            <Link className="inline-action" to="/manage/scrolls">
              Manage published scrolls
            </Link>
            <Link className="inline-action" to="/tags">
              Edit tag palette
            </Link>
            <a className="inline-action" href="/api/docs" rel="noreferrer" target="_blank">
              Browse API docs
            </a>
          </div>
        </Panel>

        <Panel
          copy="The scroll endpoint should keep serving the last generated artifact even when the API has a bad day."
          kicker="Artifact contract"
          title="Publication model"
        >
          <div className="artifact-box">
            <p className="artifact-box__label">Published path</p>
            <code>/scrolls/&lt;scroll-name&gt;</code>
          </div>
          <div className="action-stack">
            {firstScrollName ? (
              <a
                className="inline-action"
                href={`${window.location.origin}/scrolls/${firstScrollName}`}
                rel="noreferrer"
                target="_blank"
              >
                Open latest known scroll
              </a>
            ) : (
              <p className="empty-inline">Create a scroll to publish an artifact link here.</p>
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}
