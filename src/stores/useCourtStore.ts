import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import { getCourtClient } from '@/utils/CourtClient';
import { activeCase } from '@/data'; // Assuming data is also migrated or accessible
import type {
    Message,
    UIRole,
    ActiveNode,
    InterruptState,
    BackendEvidence,
    TrialPhase,
    CaseInfo,
    SessionCreatedData,
    NodeExecutedData,
    InterruptRequestData,
    TrialCompletedData,
    ErrorData,
    UserRole,
    BackendRole,
    EvidenceInputPayload
} from '@/types';

// Constants
export const NODE_TO_PHASE: Record<string, TrialPhase> = {
    'clerk_rules': '开庭阶段',
    'judge_open': '开庭阶段',
    'judge_check': '开庭阶段',
    'right_notify': '开庭阶段',
    'pros_indictment': '开庭阶段',
    'defense_defense_object_control': '开庭阶段',
    'defense_objection': '开庭阶段',
    'pros_question': '法庭调查',
    'defense_reply': '法庭调查',
    'defense_question_control': '法庭调查',
    'defense_question': '法庭调查',
    'pros_summary': '法庭调查',
    'defense_summary': '法庭调查',
    'judge_start_evidence': '法庭调查',
    'pros_evidence_decision': '法庭调查',
    'pros_show_evidence': '法庭调查',
    'defense_cross': '法庭调查',
    'judge_confirm': '法庭调查',
    'defense_evidence_control': '法庭调查',
    'defense_show_evidence': '法庭调查',
    'pros_cross': '法庭调查',
    'judge_start_debate': '法庭辩论',
    'pros_statement': '法庭辩论',
    'defense_self_statement': '法庭辩论',
    'defense_statement': '法庭辩论',
    'judge_summary': '法庭辩论',
    'focus': '法庭辩论',
    'pros_focus': '法庭辩论',
    'defense_focus': '法庭辩论',
    'pros_sumup': '法庭辩论',
    'defense_sumup': '法庭辩论',
    'defense_final_statement': '法庭辩论',
    'judge_verdict': '宣判阶段'
};

export const ROLE_MAPPINGS: Record<UserRole, BackendRole> = {
    'Prosecutor AI': '原告律师',
    'Defense AI': '被告律师',
    'Judge AI': '法官',
    'Observer': null
};

export const BACKEND_TO_UI_ROLE: Record<string, UIRole> = {
    '原告律师': 'prosecutor',
    'B(原告律师)': 'prosecutor',
    '被告律师': 'defense',
    'C(被告律师)': 'defense',
    '法官': 'judge',
    'A(法官)': 'judge',
    '审判长': 'judge',
    '书记员': 'clerk',
    '公诉人': 'prosecutor',
    '被告人': 'defense',
    '辩护人': 'defense',
    'System': 'system',
    'User': 'user'
};

const INITIAL_MESSAGES: Message[] = [
    { id: 'sys_init', role: 'system', name: 'System', content: '系统已就绪。请配置案件信息并开始庭审。', timestamp: '00:00' }
];

const INITIAL_INTERRUPT_STATE: InterruptState = {
    isInterrupted: false,
    nodeName: null,
    inputType: null,
    prompt: '',
    options: null,
    metadata: undefined
};

// Helpers
function nodeNameToActiveNode(nodeName: string): ActiveNode {
    if (nodeName.includes('pros') || nodeName.includes('prosecutor')) return 'prosecutor';
    if (nodeName.includes('defense') || nodeName.includes('defendant')) return 'defense';
    if (nodeName.includes('judge') || nodeName.includes('focus') || nodeName.includes('verdict')) return 'judge';
    if (nodeName.includes('clerk')) return 'clerk';
    return 'standby';
}

export function inferUIRole(speakerName?: string): UIRole {
    if (!speakerName) return 'system';
    if (speakerName.startsWith('书记员')) return 'clerk';
    if (speakerName.startsWith('审判长') || speakerName.startsWith('法官')) return 'judge';
    if (speakerName.startsWith('公诉人') || speakerName.startsWith('检察员')) return 'prosecutor';
    if (speakerName.startsWith('被告人') || speakerName.startsWith('被告') ||
        speakerName.startsWith('辩护人') || speakerName.startsWith('辩护代理人') ||
        speakerName.startsWith('辩护')) return 'defense';
    return 'system';
}

export function extractSpeakerName(content: string, msgName?: string): string {
    if (msgName) return msgName;
    const patterns = [
        /^(审判长[^：:]*)[：:]/,
        /^(公诉人[^：:]*)[：:]/,
        /^(被告人[^：:]*)[：:]/,
        /^(辩护人[^：:]*)[：:]/,
        /^(书记员[^：:]*)[：:]/,
    ];
    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) return match[1];
    }
    return 'System';
}

export const useCourtStore = defineStore('court', () => {
    // Note: getCourtClient() returns a singleton, so we can access it directly.
    // However, for pure actions, we'll access it inside the action functions.

    // --- State ---
    const messages = ref<Message[]>([...INITIAL_MESSAGES]);
    const logs = ref<string[]>([]);

    const isConnected = ref(false);
    const isConnecting = ref(false);
    const sessionId = ref<string | null>(null);
    const threadId = ref<string | null>(null);

    const currentPhase = ref<TrialPhase | string>('准备阶段');
    const rounds = reactive({
        pros_question_rounds: 0,
        pros_evidence_rounds: 0,
        pros_focus_rounds: 0
    });

    const currentSpeaker = ref('');
    const activeNode = ref<ActiveNode>('standby');
    const isTurnToSpeak = ref(false);

    const interruptState = ref<InterruptState>({ ...INITIAL_INTERRUPT_STATE });
    const lastInterruptReq = ref<InterruptState | null>(null);

    const progress = ref(0);
    const focus = ref<string[]>([]);
    const evidenceList = ref<BackendEvidence[]>([]);

    // Deduplication Refs (non-reactive for performance)
    const processedMessageCount = ref(0);
    const processedContentSet = ref(new Set<string>());

    // --- Actions ---

    function addMessage(role: UIRole, name: string, content: string, isSelf: boolean = false, nodeName?: string) {
        messages.value.push({
            id: Date.now() + Math.random(),
            role,
            name,
            content,
            isSelf,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeName
        });
    }

    function addLog(msg: string) {
        logs.value.unshift(`[${new Date().toLocaleTimeString('en-GB')}] ${msg}`);
    }

    function resetSession() {
        messages.value = [...INITIAL_MESSAGES];
        isConnected.value = false;
        isConnecting.value = false;
        sessionId.value = null;
        threadId.value = null;
        currentPhase.value = '准备阶段';
        rounds.pros_question_rounds = 0;
        rounds.pros_evidence_rounds = 0;
        rounds.pros_focus_rounds = 0;
        currentSpeaker.value = '';
        activeNode.value = 'standby';
        isTurnToSpeak.value = false;
        interruptState.value = { ...INITIAL_INTERRUPT_STATE };
        lastInterruptReq.value = null;
        progress.value = 0;
        focus.value = [];
        evidenceList.value = [];
        logs.value = [];
        processedMessageCount.value = 0;
        processedContentSet.value.clear();
    }

    // --- WebSocket Handlers ---

    function handleSessionCreated(data: SessionCreatedData) {
        processedMessageCount.value = 0;
        processedContentSet.value.clear();

        sessionId.value = data.thread_id;
        threadId.value = data.thread_id;
        isConnected.value = true;
        isConnecting.value = false;
        activeNode.value = 'judge';

        addLog(`会话创建成功: ${data.thread_id.slice(0, 8)}...`);
        addMessage('system', 'System', '已连接到法庭会话，庭审即将开始...');
    }

    function handleNodeExecuted(data: NodeExecutedData) {
        const nodeName = data.node_name;
        addLog(`节点执行: ${nodeName} (进度: ${data.progress.toFixed(1)}%)`);

        // Update state
        progress.value = data.progress;
        if (data.current_phase) currentPhase.value = NODE_TO_PHASE[nodeName] || data.current_phase;
        if (data.focus) focus.value = data.focus;
        if (data.rounds) {
            rounds.pros_question_rounds = (data.rounds as any).pros_question_rounds;
            rounds.pros_evidence_rounds = (data.rounds as any).pros_evidence_rounds;
            rounds.pros_focus_rounds = (data.rounds as any).pros_focus_rounds;
        }
        activeNode.value = nodeNameToActiveNode(nodeName);
        currentSpeaker.value = nodeName;
        isTurnToSpeak.value = false;

        // Message Handling
        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(msg => {
                const role = inferUIRole(msg.name);
                const name = msg.name || extractSpeakerName(msg.content, msg.name);

                // Deduplication Logic
                if (role === 'defense') {
                    const uniqueKey = data.message_count ? `:${data.message_count}` : '';
                    const contentHash = `${msg.name || ''}::${msg.content?.slice(0, 100) || ''}${uniqueKey}`;
                    const baseContentHash = `${msg.name || ''}::${msg.content?.slice(0, 100) || ''}`;

                    if (processedContentSet.value.has(contentHash) || processedContentSet.value.has(baseContentHash)) {
                        console.log('[handleNodeExecuted] Skipping duplicate user message:', contentHash.slice(0, 50));
                        return;
                    }
                    processedContentSet.value.add(contentHash);
                    processedContentSet.value.add(baseContentHash);
                }

                addMessage(role, name, msg.content, false, nodeName);
            });

            if (data.message_count) {
                processedMessageCount.value = data.message_count;
            }
        }
    }

    function handleInterruptRequest(data: InterruptRequestData) {
        addLog(`中断请求: ${data.node_name} (类型: ${data.input_type})`);

        interruptState.value = {
            isInterrupted: true,
            nodeName: data.node_name,
            inputType: data.input_type,
            prompt: data.prompt,
            options: data.options || null,
            metadata: data.metadata
        };
        lastInterruptReq.value = interruptState.value; // Save for retry
        isTurnToSpeak.value = true;
        activeNode.value = nodeNameToActiveNode(data.node_name);

        addMessage('system', 'System', data.prompt);
    }

    function handleTrialCompleted(data: TrialCompletedData) {
        addLog('庭审已完成');
        currentPhase.value = '已结束';
        activeNode.value = 'verdict';
        progress.value = 100;
        isTurnToSpeak.value = false;
        interruptState.value = { ...INITIAL_INTERRUPT_STATE };
        addMessage('system', 'System', '🎉 庭审已完成！');
    }

    function handleError(data: ErrorData) {
        addLog(`错误: ${data.code} - ${data.message}`);
        addMessage('system', 'Error', `❌ 错误: ${data.message}`);

        if (data.code === 'WEBSOCKET_ERROR') {
            isConnected.value = false;
            isConnecting.value = false;
            activeNode.value = 'standby';
        }
    }

    // --- Public Actions ---

    async function connect(
        selectedRole: UserRole, // Not strictly used in WS connect but good for logging/context
        caseInfo: CaseInfo,
        backendEvidenceList: BackendEvidence[]
    ) {
        const client = getCourtClient();

        if (isConnected.value) {
            if (window.confirm("断开当前会话？")) {
                client.disconnect();
                isConnected.value = false;
                sessionId.value = null;
                threadId.value = null;
                activeNode.value = 'standby';
                addLog("已断开。");
            }
            return;
        }

        try {
            isConnecting.value = true;
            addLog('建立 WebSocket 连接中...');
            evidenceList.value = backendEvidenceList;

            await client.connect({
                onOpen: () => addLog('WebSocket 连接已建立'),
                onSessionCreated: handleSessionCreated,
                onNodeExecuted: handleNodeExecuted,
                onInterruptRequest: handleInterruptRequest,
                onTrialCompleted: handleTrialCompleted,
                onError: handleError,
                onClose: () => {
                    addLog('WebSocket 连接已关闭');
                    isConnected.value = false;
                    sessionId.value = null;
                    threadId.value = null;
                    activeNode.value = 'standby';
                }
            });

            // Start Trial
            client.startTrial(caseInfo, backendEvidenceList);
            addLog('发送开始庭审请求...');
        } catch (e: any) {
            addLog(`连接失败: ${e.message}`);
            alert("连接失败，请确保后端服务正在运行。");
            isConnecting.value = false;
            isConnected.value = false;
            activeNode.value = 'standby';
        }
    }

    async function disconnect() {
        const client = getCourtClient();
        client.disconnect();
        isConnected.value = false;
        sessionId.value = null;
        threadId.value = null;
        activeNode.value = 'standby';
        addLog("已断开。");
    }

    async function clearSession() {
        await disconnect();
        resetSession();
        addLog('会话已清除。');
    }

    function respondToInterrupt(input: boolean | string | EvidenceInputPayload) {
        if (!interruptState.value.isInterrupted || !interruptState.value.nodeName) {
            addLog('错误: 没有活动的中断请求');
            return;
        }

        try {
            const client = getCourtClient();
            client.sendUserInput(interruptState.value.nodeName, input);
            addLog(`已响应中断: ${interruptState.value.nodeName}`);

            let displayContent: string;
            if (typeof input === 'boolean') {
                displayContent = input ? '✅ 是 / 有异议' : '❌ 否 / 无异议';
            } else if (typeof input === 'string') {
                displayContent = input;
            } else {
                displayContent = input.messages || '已提交证据';
            }

            // Get attorney name (assuming activeCase is available globally or passed in)
            // For now, we import activeCase from '@/data'.
            const attorneyName = activeCase.meta.attorney_name || '辩护代理人';
            const userDisplayName = `用户 (${attorneyName})`;

            // Optimistic update & Deduplication
            const contentPrefix = displayContent.slice(0, 100);
            processedContentSet.value.add(`${userDisplayName}::${contentPrefix}`);
            processedContentSet.value.add(`::${contentPrefix}`);
            processedContentSet.value.add(`辩护代理人::${contentPrefix}`);
            processedContentSet.value.add(`辩护代理人${attorneyName}::${contentPrefix}`);

            addMessage('defense', userDisplayName, displayContent, true);

            // Clear interrupt state locally
            interruptState.value = { ...INITIAL_INTERRUPT_STATE };
            isTurnToSpeak.value = false;

        } catch (e: any) {
            addLog(`发送输入失败: ${e.message}`);
        }
    }

    function sendMessage(content: string, selectedRole: UserRole) {
        if (!content.trim()) return false;
        if (!interruptState.value.isInterrupted) {
            addLog('警告: 当前不需要输入');
            return false;
        }
        respondToInterrupt(content);
        return true;
    }

    function retry() {
        if (lastInterruptReq.value) {
            interruptState.value = lastInterruptReq.value;
            isTurnToSpeak.value = true;
            activeNode.value = nodeNameToActiveNode(lastInterruptReq.value.nodeName || '');

            addLog('用户触发重试，已恢复上次中断请求');
            addMessage('system', 'System', '⚠️ 系统提示：您已触发【重试】操作，正在恢复上一次的输入请求，请重新提交...', false);
        } else {
            addLog('没有可重试的操作');
        }
    }

    return {
        // State
        messages,
        logs,
        isConnected,
        isConnecting,
        sessionId,
        threadId,
        currentPhase,
        rounds,
        currentSpeaker,
        activeNode,
        isTurnToSpeak,
        interruptState,
        lastInterruptReq,
        progress,
        focus,
        evidenceList,

        // Actions
        addMessage,
        addLog,
        connect,
        disconnect,
        clearSession,
        respondToInterrupt,
        sendMessage,
        retry
    };
});
