// Chaves dos dados salvos pela aplicação no navegador.
const STORAGE_KEY = "prompts_storage"
const UI_KEY = "prompts_ui"

// Estado da aplicação.
const state = {
  prompts: [],
  selectedId: null,
  tags: [], // tags do prompt em edição
  fav: false, // favorito do prompt em edição
  dirty: false,
  filterTag: null,
  sort: "recent",
}

const $ = (id) => document.getElementById(id)

const elements = {
  app: document.querySelector(".app"),
  sidebar: $("sidebar"),
  scrim: $("scrim"),
  btnOpen: $("btn-open"),
  btnCollapse: $("btn-collapse"),
  search: $("search"),
  btnNew: $("btn-new"),
  sort: $("sort"),
  count: $("count"),
  tagFilter: $("tag-filter"),
  list: $("prompt-list"),
  btnExport: $("btn-export"),
  btnImport: $("btn-import"),
  fileImport: $("file-import"),
  status: $("status"),
  btnFav: $("btn-fav"),
  btnDup: $("btn-dup"),
  btnCopy: $("btn-copy"),
  btnSave: $("btn-save"),
  promptTitle: $("prompt-title"),
  titleWrapper: $("title-wrapper"),
  tagChips: $("tag-chips"),
  tagInput: $("tag-input"),
  promptContent: $("prompt-content"),
  vars: $("vars"),
  metrics: $("metrics"),
  dialog: $("var-dialog"),
  varForm: $("var-form"),
  varFields: $("var-fields"),
  varCancel: $("var-cancel"),
  toasts: $("toasts"),
}

const isMobile = () => window.matchMedia("(max-width: 840px)").matches

/* ---------- utilidades ---------- */

function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  )
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// Prompts antigos guardavam HTML no conteúdo; converte para texto puro.
function htmlToText(html) {
  if (!/<[a-z][\s\S]*>/i.test(html)) return html
  const tmp = document.createElement("div")
  tmp.innerHTML = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<(div|p|li)[\s>]/gi, "\n<$1>")
    .replace(/<\/(div|p|li)>/gi, "\n")
  return tmp.textContent.replace(/\n{2,}/g, "\n").trim()
}

function normalizeTag(tag) {
  return tag.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-").slice(0, 24)
}

function extractVars(text) {
  const found = []
  for (const m of text.matchAll(/\{\{\s*([\w\- À-ÿ]+?)\s*\}\}/g)) {
    if (!found.includes(m[1])) found.push(m[1])
  }
  return found
}

function formatDate(ts) {
  if (!ts) return ""
  const d = new Date(ts)
  const diff = Date.now() - ts
  if (diff < 60_000) return "agora"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`
  if (diff < 86_400_000 && d.getDate() === new Date().getDate())
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

/* ---------- avisos (toasts) ---------- */

function toast(message, { action, onAction, duration = 3200 } = {}) {
  const el = document.createElement("div")
  el.className = "toast"
  const text = document.createElement("span")
  text.textContent = message
  el.appendChild(text)

  const close = () => {
    el.classList.add("is-leaving")
    setTimeout(() => el.remove(), 200)
  }

  if (action) {
    const btn = document.createElement("button")
    btn.textContent = action
    btn.addEventListener("click", () => {
      onAction?.()
      close()
    })
    el.appendChild(btn)
  }

  elements.toasts.appendChild(el)
  setTimeout(close, duration)
}

/* ---------- persistência ---------- */

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prompts))
  } catch (error) {
    console.log("Erro ao salvar no localStorage:", error)
    toast("Não foi possível salvar no navegador.")
  }
}

function load() {
  try {
    const storage = localStorage.getItem(STORAGE_KEY)
    const parsed = storage ? JSON.parse(storage) : []
    state.prompts = Array.isArray(parsed) ? parsed.map(migrate) : []
  } catch (error) {
    console.log("Erro ao carregar do localStorage:", error)
    state.prompts = []
  }
  state.selectedId = null

  try {
    const ui = JSON.parse(localStorage.getItem(UI_KEY) || "{}")
    if (ui.sort) state.sort = ui.sort
    if (ui.collapsed && !isMobile()) closeSidebar(false)
  } catch (error) {
    /* preferências de interface são opcionais */
  }
}

function saveUi() {
  try {
    localStorage.setItem(
      UI_KEY,
      JSON.stringify({
        sort: state.sort,
        collapsed: elements.app.classList.contains("sidebar-closed"),
      })
    )
  } catch (error) {
    /* ignora */
  }
}

// Garante o formato atual em prompts de versões antigas ou importados.
function migrate(p) {
  const now = Date.now()
  return {
    id: String(p.id || uid()),
    title: String(p.title || "Sem título"),
    content: htmlToText(String(p.content || "")),
    tags: Array.isArray(p.tags) ? [...new Set(p.tags.map(normalizeTag).filter(Boolean))] : [],
    fav: Boolean(p.fav),
    createdAt: Number(p.createdAt) || Number(p.updatedAt) || now,
    updatedAt: Number(p.updatedAt) || Number(p.createdAt) || now,
  }
}

/* ---------- sidebar ---------- */

function openSidebar() {
  elements.app.classList.remove("sidebar-closed")
  if (isMobile()) elements.scrim.hidden = false
  saveUi()
}

function closeSidebar(save = true) {
  elements.app.classList.add("sidebar-closed")
  elements.scrim.hidden = true
  if (save) saveUi()
}

/* ---------- lista ---------- */

function visiblePrompts() {
  const q = elements.search.value.toLowerCase().trim()
  let list = state.prompts.filter((p) => {
    if (state.filterTag && !p.tags.includes(state.filterTag)) return false
    if (!q) return true
    return (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q.replace(/^#/, "")))
    )
  })

  const byRecent = (a, b) => b.updatedAt - a.updatedAt
  if (state.sort === "az") list.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
  else if (state.sort === "fav") list.sort((a, b) => b.fav - a.fav || byRecent(a, b))
  else list.sort(byRecent)
  return list
}

function createPromptItem(p) {
  const preview = escapeHtml(p.content.replace(/\s+/g, " ").slice(0, 90))
  const tags = p.tags
    .slice(0, 3)
    .map((t) => `<span class="tag-mini">#${escapeHtml(t)}</span>`)
    .join("")

  return `
    <li class="prompt-item ${p.id === state.selectedId ? "is-active" : ""}" data-id="${p.id}">
      <div class="prompt-item-content" data-action="select" tabindex="0" role="button">
        <div class="prompt-item-text">
          <div class="prompt-item-title">
            ${p.fav ? '<span class="star" aria-label="Favorito">★</span>' : ""}
            <span>${escapeHtml(p.title)}</span>
          </div>
          <div class="prompt-item-preview">${preview || "Sem conteúdo"}</div>
          <div class="prompt-item-meta">${tags}<time>${formatDate(p.updatedAt)}</time></div>
        </div>
        <button class="btn-icon" title="Remover" aria-label="Remover prompt" data-action="remove">
          <img src="./assets/remove.svg" alt="" class="icon icon-trash" />
        </button>
      </div>
    </li>`
}

function renderTagFilter() {
  const counts = {}
  state.prompts.forEach((p) => p.tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1)))
  const tags = Object.keys(counts).sort()
  if (state.filterTag && !counts[state.filterTag]) state.filterTag = null

  elements.tagFilter.hidden = tags.length === 0
  elements.tagFilter.innerHTML = tags
    .map(
      (t) =>
        `<button class="chip ${t === state.filterTag ? "is-on" : ""}" data-tag="${escapeHtml(t)}">#${escapeHtml(t)} <small>${counts[t]}</small></button>`
    )
    .join("")
}

function renderList() {
  const list = visiblePrompts()
  renderTagFilter()

  elements.count.textContent =
    state.prompts.length === 0
      ? "Nenhum prompt"
      : list.length === state.prompts.length
        ? `${list.length} ${list.length === 1 ? "prompt" : "prompts"}`
        : `${list.length} de ${state.prompts.length}`

  if (list.length === 0) {
    elements.list.innerHTML = `<li class="empty-list">${
      state.prompts.length === 0
        ? "Seus prompts aparecem aqui.<br />Crie o primeiro com <strong>+ Novo prompt</strong>."
        : "Nada encontrado para esse filtro."
    }</li>`
    return
  }
  elements.list.innerHTML = list.map(createPromptItem).join("")
}

/* ---------- editor ---------- */

function updateEmptyState() {
  elements.titleWrapper.classList.toggle(
    "is-empty",
    elements.promptTitle.textContent.trim().length === 0
  )
}

function renderTagChips() {
  elements.tagChips.innerHTML = state.tags
    .map(
      (t) =>
        `<span class="chip chip-edit">#${escapeHtml(t)}<button type="button" data-remove-tag="${escapeHtml(t)}" aria-label="Remover tag ${escapeHtml(t)}">×</button></span>`
    )
    .join("")
}

function renderMeta() {
  const text = elements.promptContent.value
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const tokens = Math.ceil(text.length / 4)
  elements.metrics.textContent = `${words} palavras · ${text.length} caracteres · ~${tokens} tokens`

  elements.vars.innerHTML = extractVars(text)
    .map((v) => `<span class="var-pill">{{${escapeHtml(v)}}}</span>`)
    .join("")
}

function renderStatus() {
  const p = state.prompts.find((x) => x.id === state.selectedId)
  elements.status.className = "status"
  if (state.dirty) {
    elements.status.textContent = "● Alterações não salvas"
    elements.status.classList.add("is-dirty")
  } else if (p) {
    elements.status.textContent = `Salvo · ${formatDate(p.updatedAt)}`
  } else {
    elements.status.textContent = "Novo prompt"
  }
  elements.btnSave.textContent = p ? "Salvar" : "Criar"
  elements.btnFav.setAttribute("aria-pressed", String(state.fav))
  elements.btnFav.classList.toggle("is-on", state.fav)
  elements.btnDup.disabled = !p
}

function markDirty() {
  state.dirty = true
  renderStatus()
}

function loadIntoEditor(p) {
  state.selectedId = p ? p.id : null
  state.tags = p ? [...p.tags] : []
  state.fav = p ? p.fav : false
  state.dirty = false
  elements.promptTitle.textContent = p ? p.title : ""
  elements.promptContent.value = p ? p.content : ""
  elements.tagInput.value = ""
  updateEmptyState()
  renderTagChips()
  renderMeta()
  renderStatus()
  renderList()
}

function confirmDiscard() {
  return !state.dirty || confirm("Há alterações não salvas. Descartar?")
}

function newPrompt() {
  if (!confirmDiscard()) return
  loadIntoEditor(null)
  elements.promptTitle.focus()
  if (isMobile()) closeSidebar(false)
}

function commitPendingTag() {
  const tag = normalizeTag(elements.tagInput.value)
  elements.tagInput.value = ""
  if (tag && !state.tags.includes(tag) && state.tags.length < 8) {
    state.tags.push(tag)
    renderTagChips()
    markDirty()
  }
}

function save() {
  commitPendingTag()
  const title = elements.promptTitle.textContent.trim()
  const content = elements.promptContent.value.trim()

  if (!title || !content) {
    toast("Título e conteúdo não podem estar vazios.")
    ;(title ? elements.promptContent : elements.promptTitle).focus()
    return
  }

  const now = Date.now()
  const existing = state.prompts.find((p) => p.id === state.selectedId)

  if (existing) {
    Object.assign(existing, { title, content, tags: [...state.tags], fav: state.fav, updatedAt: now })
  } else {
    const created = { id: uid(), title, content, tags: [...state.tags], fav: state.fav, createdAt: now, updatedAt: now }
    state.prompts.unshift(created)
    state.selectedId = created.id
  }

  state.dirty = false
  persist()
  renderList()
  renderStatus()
  toast(existing ? "Prompt atualizado." : "Prompt criado.")
}

function duplicatePrompt() {
  const p = state.prompts.find((x) => x.id === state.selectedId)
  if (!p) return
  const now = Date.now()
  const copy = { ...p, id: uid(), title: `${p.title} (cópia)`, tags: [...p.tags], createdAt: now, updatedAt: now }
  state.prompts.unshift(copy)
  persist()
  loadIntoEditor(copy)
  toast("Prompt duplicado.")
}

function toggleFav() {
  state.fav = !state.fav
  const p = state.prompts.find((x) => x.id === state.selectedId)
  // Em um prompt já salvo, o favorito vale na hora, sem exigir "Salvar".
  if (p) {
    p.fav = state.fav
    persist()
    renderList()
  } else {
    markDirty()
  }
  renderStatus()
}

function removePrompt(id) {
  const index = state.prompts.findIndex((p) => p.id === id)
  if (index === -1) return
  const [removed] = state.prompts.splice(index, 1)
  persist()
  if (state.selectedId === id) loadIntoEditor(null)
  else renderList()

  toast(`"${removed.title}" removido.`, {
    action: "Desfazer",
    duration: 6000,
    onAction() {
      state.prompts.splice(index, 0, removed)
      persist()
      renderList()
    },
  })
}

/* ---------- copiar (com variáveis) ---------- */

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    toast("Copiado para a área de transferência!")
  } catch (error) {
    // Fallback para páginas abertas via file:// ou sem permissão.
    elements.promptContent.select()
    const ok = document.execCommand?.("copy")
    toast(ok ? "Copiado para a área de transferência!" : "Não foi possível copiar.")
  }
}

function copySelected() {
  const text = elements.promptContent.value
  if (!text.trim()) return toast("Não há conteúdo para copiar.")

  const vars = extractVars(text)
  if (vars.length === 0) return writeClipboard(text)

  elements.varFields.innerHTML = vars
    .map(
      (v, i) =>
        `<label class="field"><span>${escapeHtml(v)}</span><textarea rows="2" data-var="${escapeHtml(v)}" ${i === 0 ? "autofocus" : ""}></textarea></label>`
    )
    .join("")
  elements.dialog.showModal()
}

elements.varForm.addEventListener("submit", () => {
  const values = {}
  elements.varFields.querySelectorAll("[data-var]").forEach((f) => (values[f.dataset.var] = f.value))
  const filled = elements.promptContent.value.replace(
    /\{\{\s*([\w\- À-ÿ]+?)\s*\}\}/g,
    (match, name) => (values[name] ? values[name] : match)
  )
  writeClipboard(filled)
})
elements.varCancel.addEventListener("click", () => elements.dialog.close())

/* ---------- exportar / importar ---------- */

function exportPrompts() {
  if (state.prompts.length === 0) return toast("Não há prompts para exportar.")
  const blob = new Blob([JSON.stringify(state.prompts, null, 2)], { type: "application/json" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `prompts-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  toast(`${state.prompts.length} prompts exportados.`)
}

async function importPrompts(file) {
  try {
    const data = JSON.parse(await file.text())
    if (!Array.isArray(data)) throw new Error("formato")
    const known = new Set(state.prompts.map((p) => p.id))
    let added = 0
    for (const raw of data) {
      if (!raw || typeof raw !== "object" || !raw.title) continue
      const p = migrate(raw)
      if (known.has(p.id)) p.id = uid()
      known.add(p.id)
      state.prompts.push(p)
      added++
    }
    persist()
    renderList()
    toast(added ? `${added} prompts importados.` : "Nenhum prompt válido no arquivo.")
  } catch (error) {
    toast("Arquivo inválido. Use um JSON exportado por aqui.")
  }
}

/* ---------- eventos ---------- */

elements.btnSave.addEventListener("click", save)
elements.btnNew.addEventListener("click", newPrompt)
elements.btnCopy.addEventListener("click", copySelected)
elements.btnFav.addEventListener("click", toggleFav)
elements.btnDup.addEventListener("click", duplicatePrompt)
elements.btnExport.addEventListener("click", exportPrompts)
elements.btnImport.addEventListener("click", () => elements.fileImport.click())
elements.fileImport.addEventListener("change", () => {
  const [file] = elements.fileImport.files
  if (file) importPrompts(file)
  elements.fileImport.value = ""
})

elements.btnOpen.addEventListener("click", openSidebar)
elements.btnCollapse.addEventListener("click", () => closeSidebar())
elements.scrim.addEventListener("click", () => closeSidebar(false))

elements.search.addEventListener("input", renderList)
elements.sort.addEventListener("change", () => {
  state.sort = elements.sort.value
  saveUi()
  renderList()
})

elements.tagFilter.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-tag]")
  if (!chip) return
  state.filterTag = state.filterTag === chip.dataset.tag ? null : chip.dataset.tag
  renderList()
})

function selectFromList(item) {
  const prompt = state.prompts.find((p) => p.id === item.dataset.id)
  if (!prompt || prompt.id === state.selectedId) return
  if (!confirmDiscard()) return
  loadIntoEditor(prompt)
  if (isMobile()) closeSidebar(false)
}

elements.list.addEventListener("click", (event) => {
  const item = event.target.closest("[data-id]")
  if (!item) return
  if (event.target.closest("[data-action='remove']")) return removePrompt(item.dataset.id)
  selectFromList(item)
})

elements.list.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return
  const row = event.target.closest("[data-action='select']")
  if (!row || event.target !== row) return
  event.preventDefault()
  selectFromList(row.closest("[data-id]"))
})

elements.promptTitle.addEventListener("input", () => {
  updateEmptyState()
  markDirty()
})
elements.promptTitle.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault()
    elements.promptContent.focus()
  }
})
elements.promptContent.addEventListener("input", () => {
  renderMeta()
  markDirty()
})

elements.tagInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault()
    commitPendingTag()
  } else if (event.key === "Backspace" && !elements.tagInput.value && state.tags.length) {
    state.tags.pop()
    renderTagChips()
    markDirty()
  }
})
elements.tagInput.addEventListener("blur", commitPendingTag)
elements.tagChips.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-remove-tag]")
  if (!btn) return
  state.tags = state.tags.filter((t) => t !== btn.dataset.removeTag)
  renderTagChips()
  markDirty()
})

document.addEventListener("keydown", (event) => {
  const mod = event.ctrlKey || event.metaKey
  const key = event.key.toLowerCase()
  if (mod && (key === "s" || key === "enter")) {
    event.preventDefault()
    save()
  } else if (mod && key === "k") {
    event.preventDefault()
    openSidebar()
    elements.search.focus()
    elements.search.select()
  } else if (event.altKey && key === "n") {
    event.preventDefault()
    newPrompt()
  } else if (key === "escape" && document.activeElement === elements.search) {
    elements.search.value = ""
    renderList()
  }
})

window.addEventListener("beforeunload", (event) => {
  if (state.dirty) {
    event.preventDefault()
    event.returnValue = ""
  }
})

/* ---------- inicialização ---------- */

function init() {
  load()
  elements.sort.value = state.sort
  if (isMobile()) closeSidebar(false)
  loadIntoEditor(null)
}

init()
