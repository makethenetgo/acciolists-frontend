import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable, Field } from './ui';

describe('Field', () => {
  it('associates native inputs with their visible label and hint', () => {
    render(
      <Field hint="Used for notifications" label="Email">
        <input type="email" />
      </Field>
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAccessibleDescription('Used for notifications');
  });
});

describe('DataTable', () => {
  it('renders an explicit empty state across all columns', () => {
    render(
      <DataTable
        columns={[
          { id: 'name', header: 'Name', render: row => row.name },
          { id: 'type', header: 'Type', render: row => row.type },
        ]}
        emptyMessage="No results"
        rowKey={row => row.name}
        rows={[]}
      />
    );

    expect(screen.getByText('No results')).toHaveAttribute('colspan', '2');
  });
});
