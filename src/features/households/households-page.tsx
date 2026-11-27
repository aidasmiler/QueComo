import { Check, Home, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ListGroup, ListRow } from '@/components/shared/list-row';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { useActiveHousehold } from './active-household';

export function HouseholdsPage() {
  const { t } = useTranslation(['households', 'common']);
  const { households, active } = useActiveHousehold();
  return (
    <>
      <PageHeader
        title={t('list.title')}
        backTo="/profile"
        actions={
          <Button variant="secondary" asChild>
            <Link to="/welcome">
              <Plus aria-hidden="true" />
              {t('list.new')}
            </Link>
          </Button>
        }
      />
      <ListGroup>
        {households.map((household) => (
          <ListRow
            key={household.id}
            to={`/households/${household.id}`}
            icon={Home}
            label={household.name}
            detail={`${t('list.members', { count: household.memberCount })} · ${t(`common:roles.${household.role}`)}`}
            trailing={
              household.id === active?.id ? (
                <span className="bg-primary-soft inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-olive-800">
                  <Check aria-hidden="true" className="size-3.5" />
                  {t('list.active')}
                </span>
              ) : null
            }
          />
        ))}
      </ListGroup>
    </>
  );
}
