# Governed script and scene revision

Tital's final AI production review can surface findings whose repair root is an approved script line or an approved scene. The governed revision workspace therefore supports selective revision at those layers instead of forcing a broader claim/source revision or a later shot/visual workaround.

## Script revision

`SCRIPT_REVISION` targets an approved `ScriptLineRecord`.

A script revision preserves approved research questions, sources, evidence, and claims. The selected script line and only its dependent scenes, shots, and visual decisions become stale. The replacement script candidate is generated under the director's scoped revision instruction and must pass normal human review before downstream regeneration continues.

Typical uses include:

- duplicated narration;
- missing explanation of an approved scientific mechanism;
- audience-fit or jargon problems;
- wording that loses uncertainty;
- narrative-order problems whose earliest affected trusted record is a script line.

## Scene revision

`SCENE_REVISION` targets an approved `SceneRecord`.

A scene revision preserves the approved script and all scientific upstream layers. The selected scene and only its dependent shots and visual decisions become stale. The replacement scene must pass normal human review before its downstream production branch is rebuilt.

Typical uses include:

- scene chronology or structure;
- pacing and scene purpose;
- visual-summary problems;
- mismatch between approved script intent and scene construction.

## Governance rule

Revision preview is deterministic and read-only. Applying a revision preserves historical records, invalidates the current audit/production-package boundary, and marks only provenance-dependent records stale. Tital never silently rewrites an already approved production package.
