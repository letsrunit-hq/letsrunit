import { CreateButton } from '@/components/features-list/create-button';
import type { Feature } from '@letsrunit/model';
import React from 'react';
import { SuggestionItem } from './suggenstion-item';
import { TestItem } from './test-item';
import type { ActionFn } from './types';

export type FeaturesListProps = {
  className?: string;
  features: Feature[];
  create?: () => any;
  generate?: ActionFn;
  run?: ActionFn;
  remove?: ActionFn;
  restore?: ActionFn;
};

export function FeaturesList({ className, features, create, generate, run, remove, restore }: FeaturesListProps) {
  return (
    <div className={className}>
      <div className="flex flex-column gap-3">
        {create && <CreateButton onClick={() => create()} />}

        {features.map((feature) =>
          feature.body == null ? (
            <SuggestionItem
              key={feature.id}
              feature={feature}
              generate={generate}
              remove={remove}
              restore={restore}
            />
          ) : (
            <TestItem
              key={feature.id}
              feature={feature}
              run={run}
              generate={generate}
              remove={remove}
              restore={restore}
            />
          ),
        )}
      </div>
    </div>
  );
}

export default FeaturesList;
