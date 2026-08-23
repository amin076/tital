import type { ProductionPackage } from '../domain/productionPackage.js';
import {
  ProductionPackageVersionSchema,
  ProductionVersionComparisonSchema,
  ProductionVersionSummarySchema,
  type ProductionPackageVersion,
  type ProductionVersionComparison,
  type ProductionVersionCounts,
  type ProductionVersionSummary,
} from '../domain/productionVersion.js';

function counts(pkg: ProductionPackage): ProductionVersionCounts {
  return {
    researchQuestions: pkg.researchQuestions.length,
    sources: pkg.sources.length,
    evidence: pkg.evidence.length,
    claims: pkg.claims.length,
    scriptLines: pkg.scriptLines.length,
    scenes: pkg.scenes.length,
    shots: pkg.shots.length,
    visualDecisions: pkg.visualDecisions.length,
  };
}

function nextVersion(versions: readonly ProductionPackageVersion[]): number {
  return versions.reduce((max, version) => Math.max(max, version.version), 0) + 1;
}

function supersedeCurrents(
  versions: readonly ProductionPackageVersion[],
  at: string
): ProductionPackageVersion[] {
  return versions.map((version) =>
    version.status === 'CURRENT'
      ? ProductionPackageVersionSchema.parse({ ...version, status: 'SUPERSEDED', supersededAt: at })
      : version
  );
}

export function appendProductionPackageVersion(
  versions: readonly ProductionPackageVersion[],
  productionPackage: ProductionPackage,
  options: {
    revisionId?: string | null;
    changeSummary?: string;
    createdAt?: string;
  } = {}
): ProductionPackageVersion[] {
  const existing = versions.find(
    (version) => version.productionPackage.generatedAt === productionPackage.generatedAt
  );
  if (existing) {
    return versions.map((version) =>
      version.productionPackage.generatedAt === productionPackage.generatedAt
        ? ProductionPackageVersionSchema.parse({ ...version, status: 'CURRENT', supersededAt: null })
        : version.status === 'CURRENT'
          ? ProductionPackageVersionSchema.parse({ ...version, status: 'SUPERSEDED', supersededAt: options.createdAt ?? productionPackage.generatedAt })
          : version
    );
  }

  const createdAt = options.createdAt ?? productionPackage.generatedAt;
  const prepared = supersedeCurrents(versions, createdAt);
  const version = ProductionPackageVersionSchema.parse({
    version: nextVersion(prepared),
    productionPackage,
    revisionId: options.revisionId ?? null,
    createdAt,
    supersededAt: null,
    status: 'CURRENT',
    changeSummary:
      options.changeSummary ??
      (prepared.length === 0
        ? 'Initial READY_FOR_PRODUCTION package.'
        : 'Rebuilt READY_FOR_PRODUCTION package.'),
  });
  return [...prepared, version].slice(-20);
}

/** Ensures a current package is captured and then marks it superseded before revision. */
export function supersedeCurrentProductionPackage(
  versions: readonly ProductionPackageVersion[],
  productionPackage: ProductionPackage,
  at: string
): ProductionPackageVersion[] {
  const captured = versions.some(
    (version) => version.productionPackage.generatedAt === productionPackage.generatedAt
  )
    ? [...versions]
    : appendProductionPackageVersion(versions, productionPackage, {
        createdAt: productionPackage.generatedAt,
        changeSummary: versions.length === 0
          ? 'Initial READY_FOR_PRODUCTION package.'
          : 'Recovered historical production package before revision.',
      });

  return supersedeCurrents(captured, at);
}

export function summarizeProductionVersions(
  versions: readonly ProductionPackageVersion[]
): ProductionVersionSummary[] {
  return versions
    .map((version) => ProductionVersionSummarySchema.parse({
      version: version.version,
      revisionId: version.revisionId,
      createdAt: version.createdAt,
      supersededAt: version.supersededAt,
      status: version.status,
      changeSummary: version.changeSummary,
      durationMinutes: version.productionPackage.filmBrief.durationMinutes,
      counts: counts(version.productionPackage),
      auditPassed: version.productionPackage.audit.passed,
      productionStatus: version.productionPackage.status,
    }))
    .sort((a, b) => a.version - b.version);
}

export function compareProductionVersions(
  from: ProductionPackageVersion,
  to: ProductionPackageVersion
): ProductionVersionComparison {
  const fromCounts = counts(from.productionPackage);
  const toCounts = counts(to.productionPackage);
  const countDeltas = Object.fromEntries(
    Object.keys(fromCounts).map((key) => [
      key,
      toCounts[key as keyof ProductionVersionCounts] - fromCounts[key as keyof ProductionVersionCounts],
    ])
  ) as ProductionVersionCounts;
  const fromDuration = from.productionPackage.filmBrief.durationMinutes;
  const toDuration = to.productionPackage.filmBrief.durationMinutes;

  return ProductionVersionComparisonSchema.parse({
    fromVersion: from.version,
    toVersion: to.version,
    durationMinutes: { from: fromDuration, to: toDuration, delta: toDuration - fromDuration },
    countDeltas,
    revisionId: to.revisionId,
    changeSummary: to.changeSummary,
  });
}

export function latestProductionVersionComparison(
  versions: readonly ProductionPackageVersion[]
): ProductionVersionComparison | null {
  const ordered = [...versions].sort((a, b) => a.version - b.version);
  if (ordered.length < 2) return null;
  return compareProductionVersions(ordered[ordered.length - 2], ordered[ordered.length - 1]);
}
