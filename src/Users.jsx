import React, { useEffect, useState } from 'react';
import {
  Button,
  DataTable,
  Field,
  FlashMessages,
  PageHero,
  Panel,
  TagSelector,
} from './components/ui';
import { api, getErrorMessage } from './lib/api';

const defaultCreateForm = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  temporaryPassword: false,
  enabled: true,
  emailVerified: false,
  roles: ['acciolists_viewer'],
};

function filterRoleOptions(roles) {
  return roles
    .map(role => role?.name)
    .filter(name => typeof name === 'string' && name.startsWith('acciolists_'))
    .sort()
    .map(name => ({
      label: name.replace('acciolists_', '').replace(/_/g, ' '),
      value: name,
      color: name.includes('admin') ? '#ffc857' : '#7df9c5',
    }));
}

export default function Users() {
  const [authStatus, setAuthStatus] = useState(null);
  const [roleOptions, setRoleOptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashItems, setFlashItems] = useState([]);
  const [createForm, setCreateForm] = useState(defaultCreateForm);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const [statusResponse, rolesResponse, usersResponse] = await Promise.all([
        api.get('/api/auth/status'),
        api.get('/api/auth/roles'),
        api.get('/api/auth/users'),
      ]);

      setAuthStatus(statusResponse.data);
      setRoleOptions(filterRoleOptions(rolesResponse.data || []));
      setUsers(usersResponse.data || []);
      setFlashItems([]);
    } catch (error) {
      setFlashItems([
        {
          id: 'users-load-error',
          type: 'error',
          header: 'Unable to load identity data',
          content: getErrorMessage(
            error,
            'The API could not reach the Keycloak management endpoints.'
          ),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateCreateField = (key, value) => {
    setCreateForm(current => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleCreateRole = value => {
    setCreateForm(current => {
      const selected = new Set(current.roles);
      if (selected.has(value)) {
        selected.delete(value);
      } else {
        selected.add(value);
      }

      return {
        ...current,
        roles: Array.from(selected),
      };
    });
  };

  const createUser = async () => {
    if (!createForm.username.trim()) {
      setFlashItems([
        {
          id: 'users-username-required',
          type: 'warning',
          header: 'Username required',
          content: 'Provide a username before creating a local user.',
        },
      ]);
      return;
    }

    if (createForm.password.length < 8) {
      setFlashItems([
        {
          id: 'users-password-required',
          type: 'warning',
          header: 'Password too short',
          content: 'Passwords must be at least 8 characters long.',
        },
      ]);
      return;
    }

    setSaving(true);

    try {
      const response = await api.post('/api/auth/users', createForm);
      const username = response.data?.username || createForm.username.trim();

      setCreateForm(defaultCreateForm);
      setFlashItems([
        {
          id: 'users-create-success',
          type: 'success',
          header: 'User created',
          content: `Created the "${username}" Keycloak user.`,
        },
      ]);
      await loadUsers();
    } catch (error) {
      setFlashItems([
        {
          id: 'users-create-error',
          type: 'error',
          header: 'User creation failed',
          content: getErrorMessage(error, 'The user could not be created in Keycloak.'),
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async user => {
    try {
      await api.put(`/api/auth/users/${user.id}/enabled`, {
        enabled: !user.enabled,
      });
      setFlashItems([
        {
          id: `users-toggle-${user.id}`,
          type: 'success',
          header: user.enabled ? 'User disabled' : 'User enabled',
          content: `${user.username} is now ${user.enabled ? 'disabled' : 'enabled'}.`,
        },
      ]);
      await loadUsers();
    } catch (error) {
      setFlashItems([
        {
          id: `users-toggle-error-${user.id}`,
          type: 'error',
          header: 'User update failed',
          content: getErrorMessage(error, `The "${user.username}" account could not be updated.`),
        },
      ]);
    }
  };

  return (
    <div className="page-stack">
      <PageHero
        actions={
          <Button loading={loading} onClick={loadUsers} variant="primary">
            Refresh users
          </Button>
        }
        description="Provision local Keycloak users from the same control-plane surface as the rest of the app. This first pass uses the AccioLists API as the management broker."
        eyebrow="Identity control"
      >
        <div className="hero-note-list">
          <span className="hero-note">
            {authStatus?.enabled ? 'Auth enabled' : 'Auth disabled'}
          </span>
          <span className="hero-note">
            {authStatus?.bootstrap?.complete ? 'Realm bootstrapped' : 'Bootstrap pending'}
          </span>
          {authStatus?.realm ? <span className="hero-note">Realm: {authStatus.realm}</span> : null}
        </div>
      </PageHero>

      <FlashMessages items={flashItems} />

      <section className="page-grid page-grid--two">
        <Panel
          copy="New users are created directly in Keycloak. Choose one or more realm roles and decide whether the first password should be temporary."
          kicker="Create user"
          title="Add a local account"
        >
          <div className="form-grid">
            <Field label="Username">
              <input
                className="control-input"
                onChange={event => updateCreateField('username', event.target.value)}
                placeholder="secops-analyst"
                type="text"
                value={createForm.username}
              />
            </Field>

            <Field label="Email">
              <input
                className="control-input"
                onChange={event => updateCreateField('email', event.target.value)}
                placeholder="analyst@example.com"
                type="email"
                value={createForm.email}
              />
            </Field>

            <div className="page-grid page-grid--two">
              <Field label="First name">
                <input
                  className="control-input"
                  onChange={event => updateCreateField('firstName', event.target.value)}
                  placeholder="Analyst"
                  type="text"
                  value={createForm.firstName}
                />
              </Field>

              <Field label="Last name">
                <input
                  className="control-input"
                  onChange={event => updateCreateField('lastName', event.target.value)}
                  placeholder="User"
                  type="text"
                  value={createForm.lastName}
                />
              </Field>
            </div>

            <Field hint="Minimum length: 8 characters." label="Password">
              <input
                className="control-input"
                onChange={event => updateCreateField('password', event.target.value)}
                placeholder="Set an initial password"
                type="password"
                value={createForm.password}
              />
            </Field>

            <Field label="Roles">
              <TagSelector
                onToggle={toggleCreateRole}
                options={roleOptions}
                selectedValues={createForm.roles}
              />
            </Field>

            <label className="checkbox-row">
              <input
                checked={createForm.enabled}
                onChange={event => updateCreateField('enabled', event.target.checked)}
                type="checkbox"
              />
              <span>User enabled</span>
            </label>

            <label className="checkbox-row">
              <input
                checked={createForm.temporaryPassword}
                onChange={event =>
                  updateCreateField('temporaryPassword', event.target.checked)
                }
                type="checkbox"
              />
              <span>Require password change on first login</span>
            </label>

            <div className="panel-footer">
              <Button loading={saving} onClick={createUser} variant="primary">
                Create user
              </Button>
            </div>
          </div>
        </Panel>

        <Panel
          copy="This table is backed by Keycloak user records exposed through the AccioLists API. Full password reset and role-edit screens can be layered on top of the same endpoints next."
          kicker="User inventory"
          title={`Managed users (${users.length})`}
        >
          <DataTable
            columns={[
              {
                id: 'username',
                header: 'Username',
                render: item => <span className="table-primary">{item.username}</span>,
              },
              {
                id: 'identity',
                header: 'Identity',
                render: item => (
                  <div>
                    <div>{[item.first_name, item.last_name].filter(Boolean).join(' ') || 'No name set'}</div>
                    <div className="table-secondary">{item.email || 'No email set'}</div>
                  </div>
                ),
              },
              {
                id: 'roles',
                header: 'Roles',
                render: item => (
                  <div className="hero-note-list">
                    {(item.roles || []).length
                      ? item.roles.map(role => (
                          <span className="hero-note" key={role}>
                            {role.replace('acciolists_', '')}
                          </span>
                        ))
                      : <span className="table-secondary">No roles</span>}
                  </div>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                render: item => (
                  <span className={`status-pill ${item.enabled ? 'is-ready' : 'is-idle'}`}>
                    {item.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                render: item => (
                  <div className="table-actions">
                    <Button onClick={() => toggleEnabled(item)}>
                      {item.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                ),
              },
            ]}
            emptyMessage="No local users have been created yet."
            loading={loading}
            loadingMessage="Loading Keycloak users…"
            rowKey={item => item.id}
            rows={users}
          />
        </Panel>
      </section>

      <Panel
        copy={authStatus?.bootstrap?.message || 'Bootstrap status has not been loaded yet.'}
        kicker="Bootstrap status"
        title="Realm wiring"
      >
        <div className="status-list">
          <div className="status-row">
            <span
              className={`status-pill ${
                authStatus?.bootstrap?.complete ? 'is-ready' : 'is-warn'
              }`}
            >
              {authStatus?.bootstrap?.complete ? 'Ready' : 'Pending'}
            </span>
            <div>
              <h3>OIDC realm</h3>
              <p>{authStatus?.issuer_url || 'Issuer URL not configured yet.'}</p>
            </div>
          </div>
          <div className="status-row">
            <span className="status-pill is-idle">Roles</span>
            <div>
              <h3>Available application roles</h3>
              <p>
                {roleOptions.length
                  ? roleOptions.map(option => option.value).join(', ')
                  : 'No AccioLists realm roles were found yet.'}
              </p>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
