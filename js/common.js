// ── Toast ─────────────────────────────────────────────────────────
let toastTimer = null;

function showToast(message) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('toast--visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, 2200);
}

// ── WIP nav links ─────────────────────────────────────────────────
// Intercept clicks on links/buttons marked data-wip
function initWipLinks() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-wip]');
    if (!target) return;
    e.preventDefault();
    showToast('준비중입니다');
  });
}

// ── Sidebar toggle ────────────────────────────────────────────────
function initSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  if (sidebar && toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar--collapsed');
    });
  }
}

// ── Home page state machine ───────────────────────────────────────
const STATES = { EMPTY: 'empty', LOADING: 'loading', ANSWER: 'answer' };
let currentState = STATES.EMPTY;
let docViewerOpen = false;

function setState(state) {
  currentState = state;

  const stateEmpty = document.getElementById('state-empty');
  const stateChat  = document.getElementById('state-chat');
  const loadingMsg = document.getElementById('msg-loading');
  const answerMsg  = document.getElementById('msg-answer');
  const docViewer  = document.getElementById('doc-viewer');

  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.classList.toggle('demo-btn--active', btn.dataset.state === state);
  });

  if (!stateEmpty || !stateChat) return;

  if (state === STATES.EMPTY) {
    stateEmpty.style.display = 'flex';
    stateChat.style.display  = 'none';
    if (docViewer) docViewer.classList.remove('doc-viewer--open');
    docViewerOpen = false;
    resetInput();
    return;
  }

  stateEmpty.style.display = 'none';
  stateChat.style.display  = 'flex';

  if (state === STATES.LOADING) {
    if (loadingMsg) loadingMsg.style.display = 'flex';
    if (answerMsg)  answerMsg.style.display  = 'none';
    if (docViewer)  docViewer.classList.remove('doc-viewer--open');
    docViewerOpen = false;
    return;
  }

  if (state === STATES.ANSWER) {
    if (loadingMsg) loadingMsg.style.display = 'none';
    if (answerMsg)  answerMsg.style.display  = 'flex';
    if (docViewer)  { docViewer.classList.add('doc-viewer--open'); docViewerOpen = true; }
  }
}

function closeDocViewer() {
  const docViewer = document.getElementById('doc-viewer');
  if (docViewer) docViewer.classList.remove('doc-viewer--open');
  docViewerOpen = false;
}

function openDocViewer() {
  const docViewer = document.getElementById('doc-viewer');
  if (docViewer) { docViewer.classList.add('doc-viewer--open'); docViewerOpen = true; }
}

// ── Home: suggestion card click ───────────────────────────────────
function submitSuggestion(text) {
  const ta = document.getElementById('chatTextarea');
  if (ta) { ta.value = text; adjustTextarea(ta); updateSendBtn(); }
  sendMessage();
}

// ── Chat input helpers (home page) ────────────────────────────────
function adjustTextarea(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
}

function updateSendBtn() {
  const ta  = document.getElementById('chatTextarea');
  const btn = document.getElementById('sendBtn');
  if (ta && btn) btn.disabled = ta.value.trim().length === 0;
}

function resetInput() {
  const ta = document.getElementById('chatTextarea');
  if (ta) { ta.value = ''; ta.style.height = 'auto'; }
  updateSendBtn();
}

function sendMessage() {
  const ta = document.getElementById('chatTextarea');
  if (!ta || ta.value.trim() === '') return;

  const userMsgEl = document.getElementById('msg-user');
  if (userMsgEl) userMsgEl.textContent = ta.value.trim();

  resetInput();
  setState(STATES.LOADING);

  setTimeout(() => {
    setState(STATES.ANSWER);
    const thread = document.getElementById('chat-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, 2000);
}

// ── Model selector dropdown ───────────────────────────────────────
let modelDropdownOpen = false;
let selectedModel = 'Claude 3.5 Sonnet';

function toggleModelDropdown() {
  if (modelDropdownOpen) { closeModelDropdown(); return; }

  const trigger = document.getElementById('modelSelectorBtn');
  if (!trigger) return;

  const rect = trigger.getBoundingClientRect();
  const dropdown = document.createElement('div');
  dropdown.className = 'model-dropdown';
  dropdown.id = 'modelDropdown';
  dropdown.style.bottom = (window.innerHeight - rect.top + 6) + 'px';
  dropdown.style.left   = rect.left + 'px';

  const models = [
    { name: 'Claude 3.5 Sonnet', desc: '균형 잡힌 성능 · 빠른 응답', icon: '✦' },
    { name: 'Claude 3 Opus',     desc: '최고 수준 추론 · 복잡한 분석', icon: '✦' },
    { name: 'Claude 3 Haiku',    desc: '초고속 응답 · 간단한 작업', icon: '✦' },
    { name: 'GPT-4o',            desc: 'OpenAI 멀티모달 모델', icon: '⬡' },
  ];

  dropdown.innerHTML = `
    <div class="model-dropdown__header">AI 모델 선택</div>
    ${models.map(m => `
      <div class="model-option ${m.name === selectedModel ? 'model-option--selected' : ''}"
           onclick="selectModel('${m.name}')">
        <div class="model-option__icon">${m.icon}</div>
        <div class="model-option__info">
          <div class="model-option__name">${m.name}</div>
          <div class="model-option__desc">${m.desc}</div>
        </div>
        <svg class="model-option__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>`).join('')}
  `;

  document.body.appendChild(dropdown);
  modelDropdownOpen = true;
  setTimeout(() => document.addEventListener('click', closeModelOnOutside), 0);
}

function closeModelOnOutside(e) {
  const d = document.getElementById('modelDropdown');
  const t = document.getElementById('modelSelectorBtn');
  if (d && !d.contains(e.target) && (!t || !t.contains(e.target))) closeModelDropdown();
}

function closeModelDropdown() {
  const d = document.getElementById('modelDropdown');
  if (d) d.remove();
  modelDropdownOpen = false;
  document.removeEventListener('click', closeModelOnOutside);
}

function selectModel(name) {
  selectedModel = name;
  document.querySelectorAll('#modelLabel').forEach(el => el.textContent = name);
  closeModelDropdown();
}

// ── Kebab menu (conversation list) ────────────────────────────────
let kebabOpen = false;

function openKebab(e, itemEl) {
  e.stopPropagation();
  closeKebab();

  const rect = e.currentTarget.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'kebab-dropdown';
  menu.id = 'kebabMenu';
  menu.style.top  = rect.bottom + 4 + 'px';
  menu.style.left = rect.left - 120 + 'px';

  menu.innerHTML = `
    <div class="kebab-option" onclick="pinConv(event, this.closest('.kebab-dropdown'))">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      즐겨찾기에 고정
    </div>
    <div class="kebab-option" onclick="closeKebab(); showToast('준비중입니다')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      이름 바꾸기
    </div>
    <div class="kebab-option kebab-option--danger" onclick="closeKebab(); showToast('준비중입니다')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
      </svg>
      삭제
    </div>
  `;

  document.body.appendChild(menu);
  kebabOpen = true;
  setTimeout(() => document.addEventListener('click', closeKebabOnOutside), 0);
}

function closeKebabOnOutside(e) {
  const menu = document.getElementById('kebabMenu');
  if (menu && !menu.contains(e.target)) closeKebab();
}

function closeKebab() {
  const menu = document.getElementById('kebabMenu');
  if (menu) menu.remove();
  kebabOpen = false;
  document.removeEventListener('click', closeKebabOnOutside);
}

function pinConv(e, menuEl) {
  e.stopPropagation();
  closeKebab();

  // Show favorites section in sidebar
  const favSection = document.getElementById('favorites-section');
  const favList    = document.getElementById('favorites-list');
  if (favSection) favSection.style.display = '';

  if (favList) {
    const item = document.createElement('a');
    item.className = 'recent-item';
    item.href = '#';
    item.innerHTML = `
      <svg class="recent-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <span class="recent-item__label">2024년 4분기 매출 분석</span>
    `;
    favList.appendChild(item);
  }

  showToast('즐겨찾기에 추가되었습니다');
}

// ── Conversation list: select item ────────────────────────────────
function selectConv(el) {
  document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('conv-item--active'));
  el.classList.add('conv-item--active');
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initWipLinks();

  // Home page input
  const ta = document.getElementById('chatTextarea');
  if (ta) {
    ta.addEventListener('input', () => { adjustTextarea(ta); updateSendBtn(); });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    setState(STATES.EMPTY);
  }

  // Chat page reply input
  const replyTa  = document.getElementById('replyTextarea');
  const replyBtn = document.getElementById('replySendBtn');
  if (replyTa && replyBtn) {
    replyTa.addEventListener('input', () => {
      replyTa.style.height = 'auto';
      replyTa.style.height = Math.min(replyTa.scrollHeight, 160) + 'px';
      replyBtn.disabled = replyTa.value.trim().length === 0;
    });
    replyTa.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
    });
  }
});

// ── Chat page: send reply ─────────────────────────────────────────
function sendReply() {
  const ta  = document.getElementById('replyTextarea');
  const btn = document.getElementById('replySendBtn');
  if (!ta || ta.value.trim() === '') return;

  const thread = document.getElementById('conv-thread');
  if (thread) {
    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'message message--user';
    userMsg.innerHTML = `
      <div class="message__bubble">
        <div class="message__content">${escapeHtml(ta.value.trim())}</div>
        <span class="message__meta">방금 전</span>
      </div>`;
    thread.appendChild(userMsg);

    // Append typing indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'message message--ai';
    loadingMsg.innerHTML = `
      <div class="message__avatar">W</div>
      <div class="message__bubble">
        <div class="message__content">
          <div class="typing-indicator"><span></span><span></span><span></span></div>
        </div>
      </div>`;
    thread.appendChild(loadingMsg);

    thread.scrollTop = thread.scrollHeight;
  }

  ta.value = '';
  ta.style.height = 'auto';
  if (btn) btn.disabled = true;

  // Simulate response
  setTimeout(() => {
    const thread = document.getElementById('conv-thread');
    if (!thread) return;
    const loading = thread.querySelector('.typing-indicator')?.closest('.message');
    if (loading) loading.remove();

    const aiMsg = document.createElement('div');
    aiMsg.className = 'message message--ai';
    aiMsg.innerHTML = `
      <div class="message__avatar">W</div>
      <div class="message__bubble">
        <div class="message__content">
          <p>분석한 내용을 바탕으로 추가 인사이트를 공유드리겠습니다. 업로드된 문서에서 관련 데이터를 검토 중이니 잠시만 기다려 주세요.</p>
          <p>더 구체적인 질문이 있으시면 말씀해 주세요.</p>
        </div>
        <span class="message__meta">방금 전</span>
      </div>`;
    thread.appendChild(aiMsg);
    thread.scrollTop = thread.scrollHeight;
  }, 2000);
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
