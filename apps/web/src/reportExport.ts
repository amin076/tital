import type { GateRecord, ProductionPackage } from './api';

function s(record: GateRecord, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function n(record: GateRecord, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function arr(record: GateRecord, key: string): string[] {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function line(label: string, value: string | number | null): string {
  return value === null || value === '' ? '' : `${label}: ${value}\n`;
}

function list(label: string, values: string[]): string {
  if (values.length === 0) return '';
  return `${label}:\n${values.map((value) => `  - ${value}`).join('\n')}\n`;
}

function questionLabel(pkg: ProductionPackage, researchQuestionId: string): string {
  const index = pkg.researchQuestions.findIndex((record) => record.id === researchQuestionId);
  if (index === -1) return researchQuestionId;
  return `RQ ${index + 1}: ${s(pkg.researchQuestions[index], 'question')}`;
}

export function buildReadableReportText(pkg: ProductionPackage): string {
  const brief = pkg.filmBrief;
  const out: string[] = [];

  out.push('TITAL - EVIDENCE-GOVERNED SCIENTIFIC FILM PRODUCTION PACKAGE');
  out.push('='.repeat(72));
  out.push(s(brief, 'title') || 'Untitled scientific film');
  out.push(`Status: ${pkg.status}`);
  out.push(`Generated: ${new Date(pkg.generatedAt).toLocaleString()}`);
  out.push(`Scientific audit: ${pkg.audit.passed ? 'PASSED' : 'NOT PASSED'} (${pkg.audit.issues.length} issue${pkg.audit.issues.length === 1 ? '' : 's'})`);
  out.push('');

  out.push('FILM BRIEF');
  out.push('-'.repeat(72));
  out.push(line('Scientific topic', s(brief, 'scientificTopic')).trimEnd());
  out.push(line('Scientific question', s(brief, 'scientificQuestion')).trimEnd());
  out.push(line('Communication objective', s(brief, 'communicationObjective')).trimEnd());
  out.push(line('Target audience', s(brief, 'targetAudience')).trimEnd());
  out.push(line('Audience knowledge level', s(brief, 'audienceKnowledgeLevel')).trimEnd());
  out.push(line('Format', s(brief, 'format')).trimEnd());
  out.push(line('Duration', n(brief, 'durationMinutes') === null ? null : `${n(brief, 'durationMinutes')} minutes`).trimEnd());
  out.push(line('Tone', s(brief, 'tone')).trimEnd());
  out.push(list('Learning goals', arr(brief, 'learningGoals')).trimEnd());
  out.push(list('Scope', arr(brief, 'scope')).trimEnd());
  out.push(list('Out of scope', arr(brief, 'outOfScope')).trimEnd());
  out.push(list('Constraints', arr(brief, 'constraints')).trimEnd());
  out.push(list('Research requirements', arr(brief, 'researchRequirements')).trimEnd());

  out.push('\nRESEARCH QUESTIONS');
  out.push('-'.repeat(72));
  pkg.researchQuestions.forEach((record, index) => {
    out.push(`${index + 1}. ${s(record, 'question')}`);
    out.push(`   Purpose: ${s(record, 'purpose')}`);
    if (s(record, 'priority')) out.push(`   Priority: ${s(record, 'priority')}`);
    out.push('');
  });

  out.push('SOURCES');
  out.push('-'.repeat(72));
  pkg.sources.forEach((record, index) => {
    out.push(`${index + 1}. ${s(record, 'title')}`);
    out.push(`   ${questionLabel(pkg, s(record, 'researchQuestionId'))}`);
    if (s(record, 'url')) out.push(`   URL: ${s(record, 'url')}`);
    if (s(record, 'publishDate')) out.push(`   Published: ${s(record, 'publishDate')}`);
    arr(record, 'excerpts').forEach((excerpt) => out.push(`   Excerpt: ${excerpt}`));
    out.push('');
  });

  out.push('EVIDENCE');
  out.push('-'.repeat(72));
  pkg.evidence.forEach((record, index) => {
    out.push(`${index + 1}. ${s(record, 'excerpt')}`);
    out.push(`   ${questionLabel(pkg, s(record, 'researchQuestionId'))}`);
    out.push(`   Interpretation: ${s(record, 'interpretation')}`);
    if (s(record, 'strength')) out.push(`   Strength: ${s(record, 'strength')}`);
    if (s(record, 'uncertainty')) out.push(`   Uncertainty: ${s(record, 'uncertainty')}`);
    out.push('');
  });

  out.push('CLAIMS');
  out.push('-'.repeat(72));
  pkg.claims.forEach((record, index) => {
    out.push(`${index + 1}. ${s(record, 'text')}`);
    out.push(`   ${questionLabel(pkg, s(record, 'researchQuestionId'))}`);
    if (s(record, 'confidence')) out.push(`   Confidence: ${s(record, 'confidence')}`);
    if (s(record, 'uncertainty')) out.push(`   Uncertainty: ${s(record, 'uncertainty')}`);
    out.push('');
  });

  out.push('SCIENTIFIC SCRIPT');
  out.push('-'.repeat(72));
  pkg.scriptLines.forEach((record, index) => {
    out.push(`${index + 1}. ${s(record, 'text')}`);
    if (s(record, 'uncertaintyDisclosure')) out.push(`   Disclosure: ${s(record, 'uncertaintyDisclosure')}`);
  });

  out.push('\nSCENES');
  out.push('-'.repeat(72));
  pkg.scenes.forEach((record, index) => {
    out.push(`${index + 1}. ${s(record, 'title')}`);
    out.push(`   Purpose: ${s(record, 'purpose')}`);
    out.push(`   Visual summary: ${s(record, 'visualSummary')}`);
    if (s(record, 'uncertaintyDisclosure')) out.push(`   Disclosure: ${s(record, 'uncertaintyDisclosure')}`);
    out.push('');
  });

  out.push('SHOTS');
  out.push('-'.repeat(72));
  pkg.shots.forEach((record, index) => {
    out.push(`${index + 1}. ${s(record, 'description')}`);
    if (s(record, 'visualIntegrityCategory')) out.push(`   Visual category: ${s(record, 'visualIntegrityCategory')}`);
    out.push(`   Camera: ${s(record, 'cameraDirection')}`);
    out.push(`   Scientific constraint: ${s(record, 'scientificConstraint')}`);
    if (s(record, 'uncertaintyDisclosure')) out.push(`   Disclosure: ${s(record, 'uncertaintyDisclosure')}`);
    out.push('');
  });

  out.push('VISUAL DECISIONS');
  out.push('-'.repeat(72));
  pkg.visualDecisions.forEach((record, index) => {
    out.push(`${index + 1}. ${s(record, 'decision')}`);
    if (s(record, 'category')) out.push(`   Category: ${s(record, 'category')}`);
    if (s(record, 'riskLevel')) out.push(`   Risk: ${s(record, 'riskLevel')}`);
    out.push(`   Scientific constraint: ${s(record, 'scientificConstraint')}`);
    if (s(record, 'disclosure')) out.push(`   Viewer disclosure: ${s(record, 'disclosure')}`);
    out.push('');
  });

  out.push('SCIENTIFIC AUDIT');
  out.push('-'.repeat(72));
  if (pkg.audit.issues.length === 0) {
    out.push('Passed with no reported issues.');
  } else {
    pkg.audit.issues.forEach((issue, index) => {
      out.push(`${index + 1}. [${issue.severity}] ${issue.code} - ${issue.message}`);
    });
  }

  return out.filter((value, index, values) => value !== '' || values[index - 1] !== '').join('\n').trim() + '\n';
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function htmlList(values: string[]): string {
  if (values.length === 0) return '<p class="muted">None specified.</p>';
  return `<ul>${values.map((value) => `<li>${esc(value)}</li>`).join('')}</ul>`;
}

function pill(value: string, tone = 'blue'): string {
  return value ? `<span class="pill ${tone}">${esc(value)}</span>` : '';
}

function detail(label: string, value: string): string {
  return value ? `<div class="detail"><div class="detail-label">${esc(label)}</div><div>${esc(value)}</div></div>` : '';
}

function questionContext(pkg: ProductionPackage, id: string): string {
  const index = pkg.researchQuestions.findIndex((record) => record.id === id);
  if (index < 0) return '';
  return `Research question ${index + 1}`;
}

function cards(records: GateRecord[], render: (record: GateRecord, index: number) => string): string {
  return `<div class="records">${records.map(render).join('')}</div>`;
}

export function buildPrintableReportHtml(pkg: ProductionPackage): string {
  const brief = pkg.filmBrief;
  const title = s(brief, 'title') || 'Tital Production Package';
  const auditTone = pkg.audit.passed ? 'green' : 'red';
  const metrics = [
    ['Research questions', pkg.researchQuestions.length],
    ['Sources', pkg.sources.length],
    ['Evidence', pkg.evidence.length],
    ['Claims', pkg.claims.length],
    ['Script lines', pkg.scriptLines.length],
    ['Scenes', pkg.scenes.length],
    ['Shots', pkg.shots.length],
    ['Visual decisions', pkg.visualDecisions.length],
  ];

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(title)} - Tital Production Package</title>
<style>
  @page { size: A4; margin: 14mm 13mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #17243a; background: #fff; line-height: 1.5; font-size: 10.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1,h2,h3 { page-break-after: avoid; margin-top: 0; }
  h1 { font-size: 26pt; line-height: 1.1; color: #123d5a; margin-bottom: 8px; }
  h2 { font-size: 17pt; color: #123d5a; border-bottom: 2px solid #8ec5d8; padding-bottom: 5px; margin: 28px 0 14px; }
  h3 { font-size: 12.5pt; color: #173f5f; margin-bottom: 6px; }
  p { margin: 5px 0 8px; }
  a { color: #086c9d; text-decoration: none; overflow-wrap: anywhere; }
  ul { margin: 5px 0 8px 20px; padding: 0; }
  li { margin: 3px 0; }
  .cover { padding: 20px 22px; border-radius: 14px; background: linear-gradient(135deg, #edf7fb, #f7fbfd); border: 1px solid #b9dce9; }
  .eyebrow { color: #527187; text-transform: uppercase; letter-spacing: .09em; font-size: 8.5pt; font-weight: 700; }
  .subtitle { font-size: 12pt; color: #3f566b; max-width: 95%; }
  .meta-row, .pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; border: 1px solid #9ac3d5; background: #f1f8fb; color: #174c69; font-size: 8.5pt; font-weight: 700; }
  .pill.green { background: #edf8ef; border-color: #9bcea2; color: #246b2c; }
  .pill.red { background: #fff0ef; border-color: #e5aaa5; color: #96342c; }
  .pill.amber { background: #fff8e8; border-color: #e7ca7d; color: #805d09; }
  .metrics { width: 100%; border-collapse: separate; border-spacing: 6px; margin: 14px -6px 0; table-layout: fixed; }
  .metric { border: 1px solid #d7e3e8; border-radius: 9px; padding: 8px; text-align: center; background: #fbfdfe; }
  .metric strong { display: block; font-size: 16pt; color: #123d5a; }
  .metric span { font-size: 8pt; color: #5f7384; }
  .brief-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .brief-table td { padding: 7px 8px; border-bottom: 1px solid #e3eaed; vertical-align: top; }
  .brief-table td:first-child { width: 28%; font-weight: 700; color: #3e6176; background: #f8fbfc; }
  .records { display: grid; gap: 9px; }
  .record { break-inside: avoid; page-break-inside: avoid; border: 1px solid #dbe5e9; border-radius: 10px; padding: 11px 12px; background: #fff; }
  .record-number { color: #7990a0; font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
  .detail { margin: 7px 0; }
  .detail-label { color: #587184; font-size: 8.3pt; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
  .quote { border-left: 4px solid #2f7ea5; padding: 7px 0 7px 10px; font-weight: 650; color: #203c51; }
  .uncertainty { border: 1px solid #ead19b; background: #fff9ec; padding: 7px 9px; border-radius: 7px; margin-top: 7px; }
  .script-line { font-size: 12pt; font-weight: 650; color: #173f5f; background: #f2f8fb; padding: 10px 11px; border-radius: 8px; }
  .audit { padding: 11px 12px; border-radius: 9px; background: #edf8ef; border: 1px solid #a7d1ae; color: #245e2b; }
  .muted { color: #6c7d89; }
  .footer-note { margin-top: 24px; padding-top: 8px; border-top: 1px solid #dce5e9; color: #718390; font-size: 8.5pt; }
  @media print { .record { box-shadow: none; } }
</style>
</head>
<body>
  <section class="cover">
    <div class="eyebrow">Tital - Evidence-Governed Scientific Film Director</div>
    <h1>${esc(title)}</h1>
    <p class="subtitle">${esc(s(brief, 'communicationObjective'))}</p>
    <div class="meta-row">
      ${pill(pkg.status, pkg.status === 'READY_FOR_PRODUCTION' ? 'green' : 'amber')}
      ${pill(pkg.audit.passed ? 'Scientific audit passed' : 'Scientific audit failed', auditTone)}
      ${pill(`${esc(s(brief, 'targetAudience'))}`)}
      ${n(brief, 'durationMinutes') !== null ? pill(`${n(brief, 'durationMinutes')} min`) : ''}
    </div>
    <table class="metrics"><tr>${metrics.map(([label, count]) => `<td class="metric"><strong>${count}</strong><span>${esc(label)}</span></td>`).join('')}</tr></table>
    <p class="muted">Generated ${esc(new Date(pkg.generatedAt).toLocaleString())}</p>
  </section>

  <h2>Film brief</h2>
  <table class="brief-table">
    <tr><td>Scientific topic</td><td>${esc(s(brief, 'scientificTopic'))}</td></tr>
    <tr><td>Scientific question</td><td>${esc(s(brief, 'scientificQuestion'))}</td></tr>
    <tr><td>Target audience</td><td>${esc(s(brief, 'targetAudience'))}</td></tr>
    <tr><td>Audience knowledge</td><td>${esc(s(brief, 'audienceKnowledgeLevel'))}</td></tr>
    <tr><td>Format</td><td>${esc(s(brief, 'format'))}</td></tr>
    <tr><td>Tone</td><td>${esc(s(brief, 'tone'))}</td></tr>
  </table>
  <h3>Learning goals</h3>${htmlList(arr(brief, 'learningGoals'))}
  <h3>Scope</h3>${htmlList(arr(brief, 'scope'))}
  <h3>Out of scope</h3>${htmlList(arr(brief, 'outOfScope'))}
  <h3>Constraints</h3>${htmlList(arr(brief, 'constraints'))}
  <h3>Research requirements</h3>${htmlList(arr(brief, 'researchRequirements'))}

  <h2>Research questions</h2>
  ${cards(pkg.researchQuestions, (r, i) => `<article class="record"><div class="record-number">Research question ${i + 1}</div><h3>${esc(s(r, 'question'))}</h3>${detail('Purpose', s(r, 'purpose'))}<div class="pills">${pill(s(r, 'priority'))}</div></article>`)}

  <h2>Approved sources</h2>
  ${cards(pkg.sources, (r, i) => `<article class="record"><div class="record-number">Source ${i + 1} - ${esc(questionContext(pkg, s(r, 'researchQuestionId')))}</div><h3>${esc(s(r, 'title'))}</h3>${s(r, 'url') ? `<p><a href="${esc(s(r, 'url'))}">${esc(s(r, 'url'))}</a></p>` : ''}<div class="pills">${pill(s(r, 'provider'))}${pill(s(r, 'publishDate'))}</div>${arr(r, 'excerpts').length ? `<div class="detail"><div class="detail-label">Relevant excerpt${arr(r, 'excerpts').length === 1 ? '' : 's'}</div>${arr(r, 'excerpts').map((v) => `<div class="quote">${esc(v)}</div>`).join('')}</div>` : ''}</article>`)}

  <h2>Approved evidence</h2>
  ${cards(pkg.evidence, (r, i) => `<article class="record"><div class="record-number">Evidence ${i + 1} - ${esc(questionContext(pkg, s(r, 'researchQuestionId')))}</div><div class="quote">${esc(s(r, 'excerpt'))}</div>${detail('Interpretation', s(r, 'interpretation'))}<div class="pills">${pill(`Strength: ${s(r, 'strength')}`, s(r, 'strength') === 'HIGH' ? 'green' : s(r, 'strength') === 'LOW' ? 'amber' : 'blue')}</div>${s(r, 'uncertainty') ? `<div class="uncertainty"><strong>Uncertainty / limitation:</strong> ${esc(s(r, 'uncertainty'))}</div>` : ''}</article>`)}

  <h2>Approved claims</h2>
  ${cards(pkg.claims, (r, i) => `<article class="record"><div class="record-number">Claim ${i + 1} - ${esc(questionContext(pkg, s(r, 'researchQuestionId')))}</div><h3>${esc(s(r, 'text'))}</h3><div class="pills">${pill(`Confidence: ${s(r, 'confidence')}`, s(r, 'confidence') === 'HIGH' ? 'green' : s(r, 'confidence') === 'LOW' ? 'amber' : 'blue')}</div>${s(r, 'uncertainty') ? `<div class="uncertainty"><strong>Uncertainty:</strong> ${esc(s(r, 'uncertainty'))}</div>` : ''}</article>`)}

  <h2>Scientific script</h2>
  ${cards(pkg.scriptLines, (r, i) => `<article class="record"><div class="record-number">Script line ${i + 1}</div><div class="script-line">${esc(s(r, 'text'))}</div>${s(r, 'uncertaintyDisclosure') ? `<div class="uncertainty"><strong>Disclosure:</strong> ${esc(s(r, 'uncertaintyDisclosure'))}</div>` : ''}</article>`)}

  <h2>Scenes</h2>
  ${cards(pkg.scenes, (r, i) => `<article class="record"><div class="record-number">Scene ${i + 1}</div><h3>${esc(s(r, 'title'))}</h3>${detail('Purpose', s(r, 'purpose'))}${detail('Visual summary', s(r, 'visualSummary'))}${s(r, 'uncertaintyDisclosure') ? `<div class="uncertainty"><strong>Disclosure:</strong> ${esc(s(r, 'uncertaintyDisclosure'))}</div>` : ''}</article>`)}

  <h2>Shot plan</h2>
  ${cards(pkg.shots, (r, i) => `<article class="record"><div class="record-number">Shot ${i + 1}</div><h3>${esc(s(r, 'description'))}</h3><div class="pills">${pill(s(r, 'visualIntegrityCategory'))}</div>${detail('Camera direction', s(r, 'cameraDirection'))}${detail('Scientific constraint', s(r, 'scientificConstraint'))}${s(r, 'uncertaintyDisclosure') ? `<div class="uncertainty"><strong>Disclosure:</strong> ${esc(s(r, 'uncertaintyDisclosure'))}</div>` : ''}</article>`)}

  <h2>Governed visual decisions</h2>
  ${cards(pkg.visualDecisions, (r, i) => `<article class="record"><div class="record-number">Visual decision ${i + 1}</div><h3>${esc(s(r, 'decision'))}</h3><div class="pills">${pill(s(r, 'category'))}${pill(`Risk: ${s(r, 'riskLevel')}`, s(r, 'riskLevel') === 'HIGH' ? 'red' : s(r, 'riskLevel') === 'MEDIUM' ? 'amber' : 'green')}</div>${detail('Scientific constraint', s(r, 'scientificConstraint'))}${detail('Viewer disclosure', s(r, 'disclosure'))}</article>`)}

  <h2>Scientific audit</h2>
  ${pkg.audit.issues.length === 0 ? '<div class="audit"><strong>Passed.</strong> No scientific audit issues were reported.</div>' : cards(pkg.audit.issues.map((issue) => ({ ...issue, status: issue.severity })) as unknown as GateRecord[], (r, i) => `<article class="record"><div class="record-number">Audit issue ${i + 1}</div><h3>${esc(s(r, 'code'))}</h3>${detail('Severity', s(r, 'severity'))}${detail('Message', s(r, 'message'))}</article>`)}

  <div class="footer-note">Generated by Tital. The JSON production package remains the machine-readable source for APIs, workflow continuation, and downstream tooling; this report is the human-readable production document.</div>
</body>
</html>`;
}

function safeFileStem(pkg: ProductionPackage): string {
  const title = s(pkg.filmBrief, 'title') || 'tital-production-package';
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'tital-production-package';
}

function downloadBlob(content: string, type: string, filename: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadJsonPackage(pkg: ProductionPackage): void {
  downloadBlob(JSON.stringify(pkg, null, 2), 'application/json', `${safeFileStem(pkg)}.json`);
}

export function downloadTextReport(pkg: ProductionPackage): void {
  downloadBlob(buildReadableReportText(pkg), 'text/plain;charset=utf-8', `${safeFileStem(pkg)}-report.txt`);
}

export function printProductionReport(pkg: ProductionPackage): boolean {
  const popup = window.open('', '_blank');
  if (!popup) return false;
  popup.opener = null;
  popup.document.open();
  popup.document.write(buildPrintableReportHtml(pkg));
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
  return true;
}
