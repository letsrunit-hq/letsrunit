'use client';

import { disableFeature, enableFeature } from '@/actions/features';
import { startGenerateRun } from '@/actions/generate';
import FeaturesList from '@/components/features-list';
import { InverseIcon } from '@/components/inverse-icon';
import { StatsToolbar } from '@/components/stats-toolbar';
import { useToast } from '@/context/toast-context';
import { useFeatureList } from '@/hooks/use-feature-list';
import type { Feature } from '@letsrunit/model';
import { Archive, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UUID } from 'node:crypto';
import { confirmDialog } from 'primereact/confirmdialog';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { ToggleButton } from 'primereact/togglebutton';
import React, { useMemo, useState } from 'react';

export type ProjectFeaturesProps = {
  className?: string;
  projectId: UUID;
};

export function ProjectFeatures({ className, projectId }: ProjectFeaturesProps) {
  const router = useRouter();
  const { features, loading } = useFeatureList(projectId);
  const [showArchived, setShowArchived] = useState(false);
  const toast = useToast();

  // Local search and type filter state (moved from FeaturesList)
  type FilterType = 'all' | 'suggestions' | 'tests';
  const filterOptions = [
    { label: 'All', value: 'all' as FilterType },
    { label: 'Suggestions', value: 'suggestions' as FilterType },
    { label: 'Test Cases', value: 'tests' as FilterType },
  ];
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => {
    const list = showArchived ? features : features.filter((f) => f.enabled);

    const totalFeatures = list.length;
    const suggestions = list.filter((f) => f.body == null).length;
    const activeTests = list.filter((f) => f.body != null).length;

    const passed = list.filter((f) => f.lastRun?.status === 'passed').length;
    const failed = list.filter((f) => f.lastRun?.status === 'failed' || f.lastRun?.status === 'error').length;
    const considered = passed + failed;
    const passRate = considered > 0 ? Math.round((passed / considered) * 100) : '-';

    return { totalFeatures, suggestions, activeTests, passRate };
  }, [features, showArchived]);

  const remove = async (feature: Feature, confirmed = false) => {
    if (feature.body && !confirmed) {
      confirmDialog({
        message: `Are you sure you want to archive "${feature.name}"?`,
        header: 'Archive',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: () => remove(feature, true),
      });
      return;
    }

    await disableFeature(feature.id);
    toast.show({
      severity: 'info',
      summary: 'Archived',
      detail: (
        <>
          &quot;{feature.name}&quot; archived{' '}
          <button onClick={() => restore(feature)} className="p-link p-0 font-medium text-sm underline ml-1">
            Undo
          </button>
        </>
      ),
    });
  };

  const restore = async (feature: Feature) => {
    await enableFeature(feature.id);
    toast.show({ severity: 'success', summary: 'Restored', detail: `"${feature.name}" restored` });
  };

  const generate = async (feature: Feature, confirmed = false) => {
    if (feature.body && !confirmed) {
      confirmDialog({
        message: 'Are you sure you want to regenerate the steps based on the test description?',
        header: 'Regenerate',
        icon: 'pi pi-exclamation-triangle',
        accept: () => generate(feature, true),
      });
      return;
    }

    const runId = await startGenerateRun(feature.id);
    router.push(`/runs/${runId}`);
  };

  const filteredFeatures = features.filter((f) => {
    if (!f.enabled && !showArchived) return false;

    const isSuggestion = f.body == null;
    const matchesFilter = filter === 'all' ? true : filter === 'suggestions' ? isSuggestion : !isSuggestion;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <></>;

  return (
    <div className={className}>
      <div className="flex flex-column md:flex-row md:align-items-center gap-3 mb-4">
        <div className="w-full md:flex-1">
          <IconField iconPosition="left" className="w-full">
            <InputIcon>
              <Search size={16} />
            </InputIcon>
            <InputText
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full"
            />
          </IconField>
        </div>

        <div className="flex align-items-center justify-content-between gap-2 md:gap-3">
          <ToggleButton
            onLabel=""
            offLabel=""
            checked={showArchived}
            onChange={(e) => setShowArchived(e.value)}
            onIcon={<Archive size={24} />}
            offIcon={<InverseIcon Icon={Archive} size={24} />}
            tooltip="Show archived"
          />

          <Dropdown
            value={filter}
            onChange={(e: DropdownChangeEvent) => setFilter(e.value as FilterType)}
            options={filterOptions}
            className="min-w-12rem"
            placeholder="Filter"
          />
        </div>
      </div>

      <FeaturesList
        features={filteredFeatures}
        remove={(feature: Feature) => void remove(feature)}
        restore={(feature: Feature) => void restore(feature)}
        generate={(feature: Feature) => void generate(feature)}
        run={() => {}}
      />

      <StatsToolbar
        totalFeatures={stats.totalFeatures}
        activeTests={stats.activeTests}
        suggestions={stats.suggestions}
        passRate={stats.passRate}
      />
    </div>
  );
}

export default ProjectFeatures;
