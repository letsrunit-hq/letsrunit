import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectPanel } from './project-panel';
import type { Project } from '@letsrunit/model';
import ISO6391 from 'iso-639-1';

describe('ProjectPanel', () => {
  const project: Project = {
    id: '00000000-0000-0000-0000-000000000001',
    accountId: '00000000-0000-0000-0000-000000000002',
    url: 'https://ecommerce.example.com',
    title: 'Ecommerce Demo',
    description: 'Full-stack e-commerce platform with BDD testing',
    image: null,
    favicon: null,
    screenshot: 'https://cdn.example.com/screenshots/ecommerce.png',
    lang: 'nl',
    loginAvailable: true,
    visibility: 'public',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: '00000000-0000-0000-0000-000000000003',
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    updatedBy: '00000000-0000-0000-0000-000000000004',
  };

  it('renders labels, project details, and children', () => {
    render(<ProjectPanel project={project} />);

    const languageLabel = ISO6391.getName(project.lang!) || project.lang!;

    // Labels converted to PrimeFlex text utilities
    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();

    // Link text (hostname derived from URL)
    expect(screen.getByText('ecommerce.example.com')).toBeInTheDocument();

    // Description and Language values
    expect(screen.getByText(project.description!)).toBeInTheDocument();
    expect(screen.getByText(languageLabel)).toBeInTheDocument();

    // Screenshot image rendered
    expect(screen.getByRole('img', { name: /ecommerce\.example\.com screenshot/i })).toBeInTheDocument();
  });
});
