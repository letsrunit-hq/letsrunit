import { Tile } from '@/components/tile';
import type { Project } from '@letsrunit/model';
import { cn } from '@letsrunit/utils';
import { ArrowLeft, Building2, User, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import React from 'react';
import ShimmerButton from '../../shimmer-button/shimmer-button';

export type MobileNavBarProps = {
  selectedProject?: Pick<Project, 'id' | 'name' | 'favicon'>;
  selectedOrgName?: string;
  onMenuClick: () => void;
  onProjectClick?: () => void;
  isAnonymous?: boolean;
  className?: string;
};

export function MobileNavBar({
  selectedProject,
  selectedOrgName,
  onMenuClick,
  onProjectClick,
  isAnonymous,
  className,
}: MobileNavBarProps) {
  const router = useRouter();
  const showBackButton = !!(selectedProject || selectedOrgName);

  const handleBack = () => {
    if (selectedProject && window.location.pathname.includes('/runs/')) {
      router.push(`/projects/${selectedProject.id}`);
    } else {
      router.push('/projects');
    }
  };

  const leftContents = (
    <div className="flex align-items-center">
      {showBackButton && (
        <Button
          icon={<ArrowLeft size={20} />}
          onClick={handleBack}
          className="p-button-text p-button-plain p-button-rounded"
        />
      )}
    </div>
  );

  const centerContents = (
    <div className={cn('flex align-items-center gap-2', onProjectClick && 'cursor-pointer')} onClick={onProjectClick}>
      {selectedProject ? (
        <>
          {selectedProject.favicon && <Tile size="xs" image={selectedProject.favicon} />}
          <span className="font-semibold white-space-nowrap overflow-hidden text-overflow-ellipsis max-w-10rem">
            {selectedProject.name}
          </span>
        </>
      ) : (
        <>
          {selectedOrgName ? <Building2 size={20} /> : <User size={20} />}
          <span className="font-semibold white-space-nowrap overflow-hidden text-overflow-ellipsis max-w-10rem">
            {selectedOrgName || 'Personal'}
          </span>
        </>
      )}
    </div>
  );

  const rightContents = (
    <div className="flex align-items-center">
      {isAnonymous ? (
        <ShimmerButton icon={<UserPlus size={20} />} onClick={() => router.push('/auth/signup')} rounded />
      ) : (
        <Button icon={<User size={20} />} onClick={onMenuClick} text severity="secondary" />
      )}
    </div>
  );

  return (
    <Toolbar
      start={leftContents}
      center={centerContents}
      end={rightContents}
      className={cn(
        'bg-subtle border-none border-bottom-1 border-noround border-subtle h-4rem fixed top-0 z-5 w-full py-0',
        className,
      )}
    />
  );
}

export default MobileNavBar;
