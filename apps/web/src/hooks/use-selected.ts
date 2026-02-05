import type { Selected } from '@/libs/nav';
import { connect } from '@/libs/supabase/browser';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useSelected() {
  const pathname = usePathname();
  const [selected, setSelected] = useState<Selected>({});

  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean);
    const newSelected: Selected = {};

    if (parts[0] === 'projects' && parts[1]) {
      newSelected.project = parts[1];
      newSelected.page = parts[2] ? `project/${parts[2]}` : 'project';
    }

    if (parts[0] === 'org' && parts[1]) {
      newSelected.org = parts[1];
      newSelected.page = parts[2] ? `org/${parts[2]}` : undefined;
    }

    const fetchExtra = async () => {
      const supabase = connect();

      if (parts[0] === 'runs' && parts[1]) {
        const { data: run } = await supabase.from('runs').select('project_id').eq('id', parts[1]).single();
        if (run) {
          newSelected.project = run.project_id;
        }
      }

      if (newSelected.project && !newSelected.org) {
        const { data: project } = await supabase
          .from('projects')
          .select('account_id')
          .eq('id', newSelected.project)
          .single();
        if (project) {
          newSelected.org = project.account_id;
        }
      }

      setSelected(newSelected);
    };

    fetchExtra();
  }, [pathname]);

  return selected;
}

export default useSelected;
