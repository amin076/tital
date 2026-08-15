import { SceneRecordSchema, type SceneRecord } from '../domain/sceneRecord.js';

export type SceneReviewDecision = 'APPROVE' | 'REJECT';

export function reviewScene(scene: SceneRecord, decision: SceneReviewDecision): SceneRecord {
  const parsed = SceneRecordSchema.safeParse(scene);
  if (!parsed.success) {
    throw new Error(`Invalid SceneRecord schema: ${parsed.error.message}`);
  }

  if (scene.status !== 'REVIEW_REQUIRED') {
    throw new Error(
      `SceneRecord is not reviewable: expected REVIEW_REQUIRED, current status is "${scene.status}".`
    );
  }

  return SceneRecordSchema.parse({
    ...scene,
    status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
  });
}
