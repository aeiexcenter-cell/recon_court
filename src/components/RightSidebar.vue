<template>
  <div :style="{ width: `${width}px` }" class="flex flex-col bg-surface-container-low shrink-0 relative z-10 transition-colors duration-300">
    <!-- 调整大小手柄 -->
    <div
      class="absolute top-0 bottom-0 -left-3 w-6 z-50 flex justify-center cursor-col-resize group touch-none"
      @mousedown="onStartResize"
    >
      <div class="w-1 h-full rounded-full bg-transparent group-hover:bg-primary transition-colors duration-200 ease-in-out opacity-60" />
    </div>

    <!-- 控制面板 -->
    <div class="px-6 pt-8 pb-4 bg-surface-container-low space-y-4">
      <!-- 角色选择器 -->
      <div>
        <label class="text-xs font-bold text-on-surface-variant/70 uppercase mb-3 block tracking-widest opacity-70">您的角色</label>
        <RoleSelector
          :value="selectedRole"
          @update:value="updateRole"
          :disabled="isConnected"
        />
      </div>

      <!-- 开始/结束按钮 -->
      <Button
        @click="onStartTrial"
        :disabled="isConnecting"
        class="w-full justify-center h-10 rounded-full shadow-md hover:shadow-lg hover:scale-[1.01] transition-all text-sm font-semibold tracking-wide"
        :class="isConnected ? '!bg-error-container !text-on-error-container hover:brightness-95' : '!bg-primary-container !text-on-primary-container hover:brightness-95'"
      >
        <Activity v-if="isConnecting" class="mr-2 animate-spin" :size="16" />
        <RotateCcw v-else-if="isConnected" class="mr-2" :size="16" />
        <Play v-else class="mr-2 fill-current" :size="16" />
        {{ isConnecting ? '连接中...' : (isConnected ? '结束会话' : '开始庭审') }}
      </Button>

      <!-- 重试按钮 -->
      <Button
        v-if="isConnected && showRetry"
        variant="secondary"
        @click="onRetry"
        :disabled="!lastInterruptReq"
        class="w-full font-bold transition-all"
        :class="!lastInterruptReq ? 'opacity-50 cursor-not-allowed' : 'hover:bg-tertiary/10 hover:text-tertiary border border-transparent hover:border-tertiary/30'"
        size="md"
      >
        <div class="flex items-center gap-2">
          <RotateCcw :size="16" :class="lastInterruptReq ? 'text-tertiary' : ''" />
          <span>重试上一步</span>
        </div>
      </Button>

      <!-- 进度条 -->
      <div v-if="isConnected" class="space-y-2">
        <div class="flex justify-between text-xs">
          <span class="text-on-surface-variant">庭审进度</span>
          <span :class="`font-medium ${PHASE_COLORS[currentPhase] || 'text-on-surface-variant'}`">
            {{ currentPhase }}
          </span>
        </div>
        <div class="h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div class="text-right text-[10px] text-on-surface-variant/60">
          {{ progress.toFixed(0) }}% 完成
        </div>
      </div>
    </div>

    <!-- 执行流程页眉 -->
    <div class="h-10 flex items-center px-6 text-on-surface-variant font-bold tracking-widest uppercase text-xs opacity-70 mt-6 border-t border-outline-variant/20 pt-6">
      执行流程
    </div>

    <!-- 执行流程节点 -->
    <div class="flex-1 overflow-y-auto px-4 py-2 bg-surface-container-low relative custom-scrollbar">
      <div class="space-y-0 relative pb-6">
        <!-- 连接线 -->
        <div class="absolute left-[23px] top-8 bottom-8 w-0.5 bg-outline-variant/40 z-0 rounded-full" />

        <div
            v-for="step in FLOW_NODES"
            :key="step.id"
            :class="`relative flex gap-4 items-start py-3 group ${getNodeStatus(step.id) === 'active' ? 'opacity-100' : getNodeStatus(step.id) === 'completed' ? 'opacity-90' : 'opacity-60'}`"
        >
            <!-- 节点圆点 -->
            <div class="w-12 shrink-0 flex justify-center z-10 relative">
                <div :class="`relative h-12 w-12 flex items-center justify-center rounded-full transition-all duration-500
                    ${getNodeStatus(step.id) === 'active'
                        ? 'bg-primary-container text-on-primary-container scale-110 shadow-[0_0_20px_rgb(var(--md-sys-color-primary)/0.35)]'
                        : getNodeStatus(step.id) === 'completed'
                            ? 'bg-primary/20 text-primary border-2 border-primary/40'
                            : 'bg-surface-container-highest border-2 border-outline-variant/30 text-on-surface-variant'
                    }`"
                >
                    <div v-if="getNodeStatus(step.id) === 'active'" class="animate-pulse scale-125">
                        <component :is="step.icon" :size="18" />
                    </div>
                    <span v-else-if="getNodeStatus(step.id) === 'completed'" class="text-primary text-lg font-bold">✓</span>
                    <div v-else class="scale-110">
                        <component :is="step.icon" :size="18" />
                    </div>
                </div>
            </div>

            <!-- 节点内容 -->
            <div :class="`pt-2 transition-all duration-300 ${getNodeStatus(step.id) === 'active' ? 'translate-x-0.5' : ''}`">
                <h4 :class="`text-base font-semibold flex items-center gap-2 ${getNodeStatus(step.id) === 'active' ? 'text-on-surface' : getNodeStatus(step.id) === 'completed' ? 'text-on-surface/90' : 'text-on-surface-variant/80'}`">
                    {{ step.label }}
                    <span v-if="isUserNode(step.id)" class="text-[9px] bg-start-btn text-on-start-btn px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shadow-sm">
                        您
                    </span>
                </h4>
                <p :class="`text-xs leading-relaxed mt-0.5 ${getNodeStatus(step.id) === 'active' ? 'text-on-surface-variant' : 'text-on-surface-variant/60'}`">
                    {{ step.desc }}
                </p>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Play, RotateCcw, Activity, User, Gavel, ShieldAlert, ShieldCheck, BookOpen, Scale } from 'lucide-vue-next';
import RoleSelector from './RoleSelector.vue';
import Button from './Button.vue';
import type { UserRole, ActiveNode, TrialPhase } from '@/types';

// Flow Node Configuration
interface FlowNode {
    id: ActiveNode;
    label: string;
    desc: string;
    icon: any;
}

const FLOW_NODES: FlowNode[] = [
    { id: 'standby', label: '待命', desc: '准备开始', icon: Activity },
    { id: 'clerk', label: '书记员', desc: '宣布法庭纪律', icon: BookOpen },
    { id: 'judge', label: '审判长', desc: '主持法庭', icon: Gavel },
    { id: 'prosecutor', label: '公诉人', desc: '宣读起诉书/举证', icon: ShieldAlert },
    { id: 'defendant', label: '被告人', desc: '接受讯问/自我辩护', icon: User },
    { id: 'defense', label: '辩护人', desc: '质证/辩护', icon: ShieldCheck },
    { id: 'verdict', label: '宣判', desc: '审判结束', icon: Scale },
];

const USER_NODE_MAP: Record<UserRole, ActiveNode> = {
    'Prosecutor AI': 'prosecutor',
    'Defense AI': 'defense',
    'Judge AI': 'judge',
    'Observer': 'standby'
};

const PHASE_COLORS: Record<string, string> = {
    '开庭阶段': 'text-blue-400',
    '法庭调查': 'text-yellow-400',
    '法庭辩论': 'text-orange-400',
    '宣判阶段': 'text-purple-400',
    '已结束': 'text-green-400'
};

const props = withDefaults(defineProps<{
    width: number;
    selectedRole: UserRole;
    isConnected: boolean;
    isConnecting: boolean;
    currentPhase: TrialPhase | string;
    activeNode: ActiveNode;
    progress?: number;
    lastInterruptReq?: any;
    showRetry?: boolean;
}>(), {
    progress: 0,
    showRetry: true
});

const emit = defineEmits<{
    (e: 'update:selectedRole', role: UserRole): void;
    (e: 'startResize', event: MouseEvent): void;
    (e: 'startTrial'): void;
    (e: 'retry'): void;
}>();

function onStartResize(e: MouseEvent) { emit('startResize', e); }
function onStartTrial() { emit('startTrial'); }
function onRetry() { emit('retry'); }
function updateRole(role: UserRole) { emit('update:selectedRole', role); }

function isUserNode(stepId: ActiveNode): boolean {
    return USER_NODE_MAP[props.selectedRole] === stepId;
}

function getNodeStatus(nodeId: ActiveNode): 'completed' | 'active' | 'pending' {
    const nodeIndex = FLOW_NODES.findIndex(n => n.id === nodeId);
    const activeIndex = FLOW_NODES.findIndex(n => n.id === props.activeNode);

    if (nodeIndex < activeIndex) return 'completed';
    if (nodeIndex === activeIndex) return 'active';
    return 'pending';
}
</script>
