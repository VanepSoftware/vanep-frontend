import { Chip } from "@/components/ui/chip";
import {
  decisionNote,
  formatPlate,
  requirementDetail,
  requirementExpiry,
  requirementsSummary,
  vehicleDescription,
} from "@/lib/admin/driver-compliance/driver-page";
import { complianceStateTone } from "@/lib/admin/driver-compliance/tone";
import type {
  ComplianceVehicle,
  DriverComplianceDetail,
  RequirementStatus,
} from "@/lib/admin/driver-compliance/types";
import { interpolate, t } from "@/lib/l10n";

const messages = t("admin").driverReview;
const page = messages.driver;

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-6 py-3.5 sm:grid-cols-[minmax(0,1fr)_120px_150px_88px]";

export type RequirementActionProps = {
  item: RequirementStatus;
  vehicle: ComplianceVehicle | null;
};

type RequirementsListProps = {
  detail: DriverComplianceDetail;
  /** O botão do cabeçalho da seção (F5: "Revisar N pendentes"). */
  headerAction?: React.ReactNode;
  /** A ação de cada linha (F5: "Revisar" ou "Ver"). */
  RowAction?: React.ComponentType<RequirementActionProps>;
};

/** O checklist do motorista e de cada van ativa, na ordem do `CredentialRequirement`. */
export function RequirementsList({ detail, headerAction, RowAction }: RequirementsListProps) {
  const summary = requirementsSummary(detail);

  return (
    <section aria-labelledby="requirements-title" className="rounded-2xl border border-border bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h2 id="requirements-title" className="font-display text-base font-bold text-foreground">
            {page.requirementsTitle}
          </h2>
          {summary && <p className="mt-0.5 text-[13px] text-muted-foreground">{summary}</p>}
        </div>
        {headerAction}
      </header>

      <GroupHeader title={page.driverGroup} first />
      <ul>
        {detail.driverRequirements.map((item) => (
          <RequirementRow
            key={item.requirement}
            item={item}
            today={detail.asOf}
            action={RowAction ? <RowAction item={item} vehicle={null} /> : null}
          />
        ))}
      </ul>

      {detail.vehicles.length === 0 && (
        <p className="border-t border-border px-6 py-4 text-sm text-muted-foreground">{page.noVehicles}</p>
      )}

      {detail.vehicles.map((vehicle) => (
        <div key={vehicle.token}>
          <GroupHeader
            title={interpolate(page.vehicleGroup, { plate: formatPlate(vehicle.plate) })}
            description={vehicleDescription(vehicle)}
            badge={
              <Chip tone={vehicle.qualified ? "success" : "neutral"}>
                {vehicle.qualified ? page.qualified : page.notQualified}
              </Chip>
            }
          />
          <ul>
            {vehicle.requirements.map((item) => (
              <RequirementRow
                key={item.requirement}
                item={item}
                today={detail.asOf}
                action={RowAction ? <RowAction item={item} vehicle={vehicle} /> : null}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function GroupHeader({
  title,
  description,
  badge,
  first = false,
}: {
  title: string;
  description?: string | null;
  badge?: React.ReactNode;
  /** O primeiro grupo encosta no cabeçalho da seção, que já tem borda. */
  first?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 bg-background-deep px-6 py-2.5 ${
        first ? "" : "border-t border-border"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <span className="text-[13px] text-muted-foreground">{description}</span>}
      </div>
      {badge}
    </div>
  );
}

function RequirementRow({
  item,
  today,
  action,
}: {
  item: RequirementStatus;
  today: string;
  action: React.ReactNode;
}) {
  const expiry = requirementExpiry(item, today);
  const note = decisionNote(item);

  return (
    <li className={`${ROW_GRID} border-t border-border/60`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {messages.requirement[item.requirement]}
          {item.optional && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {page.optional}
            </span>
          )}
        </div>
        <div className="truncate text-[13px] text-muted-foreground">{requirementDetail(item)}</div>
        {item.pending && item.state !== "PENDING" && (
          <div className="text-[13px] font-medium text-warning">{page.renewalPending}</div>
        )}
        {note && <div className="text-[13px] text-muted-foreground">{note}</div>}
      </div>
      <span className="justify-self-end sm:justify-self-start">
        <Chip tone={complianceStateTone(item.state)}>{messages.complianceState[item.state]}</Chip>
      </span>
      <span className="col-span-2 text-[13px] text-muted-foreground sm:col-span-1">
        {expiry ?? messages.noValue}
      </span>
      {action ? (
        <span className="col-span-2 sm:col-span-1 sm:justify-self-end">{action}</span>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
    </li>
  );
}
