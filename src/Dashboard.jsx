import React, { useEffect, useState } from 'react';
import {
  Box,
  ColumnLayout,
  Container,
  ContentLayout,
  Flashbar,
  Header,
  Link,
  SpaceBetween,
  StatusIndicator,
  Button,
} from '@cloudscape-design/components';
import { api, getErrorMessage } from './lib/api';

const emptyCounts = {
  ip: 0,
  url: 0,
  domain: 0,
  tags: 0,
  scrolls: 0,
};

export default function Dashboard() {
  const [counts, setCounts] = useState(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [flashItems, setFlashItems] = useState([]);

  const totalRunes = counts.ip + counts.url + counts.domain;
  const artifactHref = `${window.location.origin}/scrolls/test-scroll`;

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

      setCounts({
        ip: ipResponse.data.length,
        url: urlResponse.data.length,
        domain: domainResponse.data.length,
        tags: tagsResponse.data.length,
        scrolls: scrollsResponse.data.length,
      });
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

  const metricCards = [
    {
      label: 'All runes',
      value: totalRunes,
      detail: 'Combined IP, URL, and domain inventory',
    },
    {
      label: 'IP runes',
      value: counts.ip,
      detail: 'Network entries available to scrolls',
    },
    {
      label: 'URL runes',
      value: counts.url,
      detail: 'URL indicators currently tracked',
    },
    {
      label: 'Domain runes',
      value: counts.domain,
      detail: 'Domain indicators currently tracked',
    },
    {
      label: 'Tags',
      value: counts.tags,
      detail: 'Classification labels and color tokens',
    },
    {
      label: 'Scrolls',
      value: counts.scrolls,
      detail: 'Generated lists available for publication',
    },
  ];

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="A Cloudscape-based control plane for rune inventory, scroll generation, and tag management."
          actions={
            <Button loading={loading} onClick={loadCounts}>
              Refresh
            </Button>
          }
        >
          Overview
        </Header>
      }
    >
      <SpaceBetween size="l">
        {flashItems.length > 0 && <Flashbar items={flashItems} />}

        <ColumnLayout columns={3} variant="text-grid">
          {metricCards.map(metric => (
            <Container key={metric.label}>
              <SpaceBetween size="xs">
                <Box variant="awsui-key-label">{metric.label}</Box>
                <div className="acciolists-metric-value">
                  {loading ? '...' : metric.value}
                </div>
                <Box color="text-body-secondary">{metric.detail}</Box>
              </SpaceBetween>
            </Container>
          ))}
        </ColumnLayout>

        <Container
          header={<Header variant="h2">Platform posture</Header>}
        >
          <ColumnLayout columns={3} variant="text-grid">
            <SpaceBetween size="xs">
              <Box variant="awsui-key-label">Refresh status</Box>
              <StatusIndicator type={loading ? 'in-progress' : 'success'}>
                {loading ? 'Loading current state' : 'Cluster-connected UI'}
              </StatusIndicator>
            </SpaceBetween>
            <SpaceBetween size="xs">
              <Box variant="awsui-key-label">Artifact endpoint</Box>
              <Link external href={artifactHref} externalIconAriaLabel="Opens in a new tab">
                Open generated scroll
              </Link>
            </SpaceBetween>
            <SpaceBetween size="xs">
              <Box variant="awsui-key-label">API surface</Box>
              <Link external href="/api/docs" externalIconAriaLabel="Opens in a new tab">
                Browse FastAPI docs
              </Link>
            </SpaceBetween>
          </ColumnLayout>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
}
