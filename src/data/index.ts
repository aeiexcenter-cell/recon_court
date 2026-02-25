import type { BackendEvidence, CaseInfo } from '@/types';
import { CASE_DATA as CASE_2016_03449 } from './cases/江公北诉字[2016]03449号/defaultCase';

/**
 * 前端可识别的案例数据结构。
 */
export interface CaseData {
    meta: CaseInfo;
    evidence: BackendEvidence[];
}

/**
 * 案例编号常量，便于后续扩展多案例时统一管理。
 */
export const CASE_IDS = {
    JIANG_GONG_BEI_SU_2016_03449: '江公北诉字[2016]03449号',
} as const;

export type CaseId = typeof CASE_IDS[keyof typeof CASE_IDS];

/**
 * 所有已注册案例（单一事实来源）。
 */
export const CASE_REGISTRY: Record<CaseId, CaseData> = {
    [CASE_IDS.JIANG_GONG_BEI_SU_2016_03449]: CASE_2016_03449,
};

/**
 * 当前激活案例 ID。
 * - 切换案例时仅需修改此处。
 */
export const ACTIVE_CASE_ID: CaseId = CASE_IDS.JIANG_GONG_BEI_SU_2016_03449;

/**
 * 当前激活案例数据。
 */
export const activeCase: CaseData = CASE_REGISTRY[ACTIVE_CASE_ID];

/**
 * 向后兼容旧导出名称。
 */
export const DEFAULT_CASE = CASE_2016_03449;
