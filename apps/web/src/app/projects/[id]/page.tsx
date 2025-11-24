import React from 'react';
import styles from './page.module.css';
import FeaturesList, { type Feature } from '../../../components/features-list';
import { StatsToolbar } from '../../../components/stats-toolbar';

const features: Feature[] = [
  {
    id: '1',
    type: 'test',
    title: 'User Login Flow',
    steps: 6,
    lastRun: { status: 'passed', timestamp: '2 min ago' },
  },
  {
    id: '2',
    type: 'suggestion',
    title: 'Password Reset Journey',
    description: 'Test the complete password reset flow including email verification',
  },
  {
    id: '3',
    type: 'test',
    title: 'Product Search & Filter',
    steps: 8,
    lastRun: { status: 'passed', timestamp: '1 hour ago' },
  },
  {
    id: '4',
    type: 'suggestion',
    title: 'Checkout with Multiple Items',
    description: 'Verify cart functionality with multiple products and variants',
  },
  {
    id: '5',
    type: 'test',
    title: 'User Registration',
    steps: 5,
    lastRun: { status: 'failed', timestamp: '3 hours ago' },
  },
  {
    id: '6',
    type: 'suggestion',
    title: 'Social Media Login Integration',
    description: 'Test OAuth login with Google, Facebook, and GitHub',
  },
  {
    id: '7',
    type: 'test',
    title: 'Add to Cart & Quantity Update',
    steps: 7,
    lastRun: { status: 'pending', timestamp: '5 hours ago' },
  },
  {
    id: '8',
    type: 'suggestion',
    title: 'Guest Checkout Flow',
    description: 'Allow users to complete purchase without registration',
  },
];

export default function Page() {
  const totalFeatures = features.length;
  const activeTests = features.filter((f) => f.type === 'test').length;
  const suggestions = features.filter((f) => f.type === 'suggestion').length;
  const passRate = 75; // placeholder until wired to real data

  return (
    <div className={`${styles.container} p-4 md:p-6 lg:p-7`}>
      <div className="mb-4">
        <h1 className={styles.title}>E-Commerce Platform</h1>
        <p className={styles.muted}>Manage and run your test suite</p>
      </div>

      <FeaturesList features={features} />

      <StatsToolbar
        totalFeatures={totalFeatures}
        activeTests={activeTests}
        suggestions={suggestions}
        passRate={passRate}
      />
    </div>
  );
}
