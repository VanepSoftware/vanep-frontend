import { Chip } from "@/components/ui/chip";
import {
  formatPlate,
  renewalNote,
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

/**
 * As colunas seguem a largura da tabela (container query), não a da tela: no
 * `lg` ela divide a linha com o histórico. A validade só aparece quando cabe.
 */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 px-4 py-3.5 @md:px-6 @2xl:grid-cols-[minmax(0,1fr)_120px_150px_88px] @2xl:gap-x-4";

/** O mesmo recuo lateral das linhas, nos cabeçalhos. */
const GUTTER = "px-4 @md:px-6";

export type RequirementActionProps = {
  driverToken: string;
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
    <section
      aria-labelledby="requirements-title"
      className="@container rounded-2xl border border-border bg-background"
    >
      <header className={`flex flex-wrap items-center justify-between gap-3 border-b border-border ${GUTTER} py-4`}>
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
            renewal={renewalNote(detail, item)}
            action={RowAction ? <RowAction driverToken={detail.driver.token} item={item} vehicle={null} /> : null}
          />
        ))}
      </ul>

      {detail.vehicles.length === 0 && (
        <p className={`border-t border-border ${GUTTER} py-4 text-sm text-muted-foreground`}>{page.noVehicles}</p>
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
                renewal={renewalNote(detail, item)}
                action={
                  RowAction ? <RowAction driverToken={detail.driver.token} item={item} vehicle={vehicle} /> : null
                }
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
      className={`flex flex-wrap items-center justify-between gap-2 bg-background-deep ${GUTTER} py-2.5 ${
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
  renewal,
  action,
}: {
  item: RequirementStatus;
  today: string;
  renewal: string | null;
  action: React.ReactNode;
}) {
  const expiry = requirementExpiry(item, today);

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
        {renewal && <div className="text-[13px] font-medium text-warning">{renewal}</div>}
      </div>
      <span className="justify-self-end @2xl:justify-self-start">
        <Chip tone={complianceStateTone(item.state)}>{messages.complianceState[item.state]}</Chip>
      </span>
      <span className="hidden text-[13px] text-muted-foreground @2xl:block">{expiry ?? messages.noValue}</span>
      <span className="justify-self-end">{action}</span>
    </li>
  );
}
