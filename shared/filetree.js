// A VS Code style file tree: folders first, then files, A to Z. Used by the slide editor and the Code Explorer.
//   FileTree.draw(host, { files, images, active, fresh, closed, onPick })
//   files: paths that open; images: paths that can't; fresh: a Set shown green; closed: a Set of folded folders
//   onNew(path, isFolder): shows ＋ File / ＋ Folder by the project name; each asks for a path and hands it over
//   dirs: empty folders made with ＋ Folder (a folder with files shows anyway)
(() => {
  const PROJECT = 'pokemon-app'
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const byName = (a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })

  function nest(paths, dirs = []) {
    const root = { dirs: {}, files: [] }
    const walk = (parts) => { let at = root; for (const d of parts) at = at.dirs[d] || (at.dirs[d] = { dirs: {}, files: [] }); return at }
    for (const d of dirs) walk(d.split('/'))
    for (const p of paths) {
      const parts = p.split('/')
      const name = parts.pop()
      walk(parts).files.push({ name, path: p })
    }
    return root
  }

  // A typed path: slashes only, no leading ./ or /, no doubled or trailing slashes
  const clean = (s) => s.trim().replace(/\\/g, '/').replace(/^\.?\/+/, '').replace(/\/{2,}/g, '/')

  function draw(host, opts) {
    const { files, images = [], dirs = [], active, fresh = new Set(), closed = new Set(), onPick, onNew } = opts
    const canOpen = new Set(files)
    // npm makes this folder; students will see it, and never edit it
    const made = files.includes('package.json') ? '<span class="ft-row ft-off" style="--d:1" title="Made by npm install. You never edit it.">▸ node_modules</span>' : ''
    const dir = (node, base, depth) => {
      const folders = Object.keys(node.dirs).sort(byName).map((d) => {
        const p = base ? base + '/' + d : d
        const shut = closed.has(p)
        return `<button type="button" class="ft-row ft-dir${p === host.dataset.at ? ' at' : ''}" style="--d:${depth}" data-dir="${esc(p)}" aria-expanded="${!shut}">${shut ? '▸' : '▾'} ${esc(d)}</button>` +
          `<div class="ft-kids"${shut ? ' hidden' : ''}>${dir(node.dirs[d], p, depth + 1)}</div>`
      }).join('')
      const leaves = node.files.sort((a, b) => byName(a.name, b.name)).map((f) => canOpen.has(f.path)
        ? `<button type="button" class="ft-row ft-file${f.path === active ? ' on' : ''}${fresh.has(f.path) ? ' new' : ''}" style="--d:${depth}" data-file="${esc(f.path)}" title="${esc(f.path)}">${esc(f.name)}</button>`
        : `<span class="ft-row ft-off" style="--d:${depth}" title="${esc(f.path)}">${esc(f.name)}</span>`).join('')
      return (depth === 1 ? made : '') + folders + leaves
    }
    const plus = onNew ? '<button type="button" class="ft-plus" data-kind="file" title="New file: type a path like src/components/Button/Button.jsx">＋File</button>' +
      '<button type="button" class="ft-plus" data-kind="folder" title="New folder: type a path like src/components/Button">＋Folder</button>' : ''
    host.innerHTML = `<div class="ft"><div class="ft-head"><div class="ft-row ft-root" style="--d:0">${PROJECT}</div>${plus}</div>${dir(nest([...files, ...images], dirs), '', 1)}</div>`
    // Clicking a folder folds it, and (like VS Code) makes it where ＋ File / ＋ Folder start
    host.querySelectorAll('.ft-dir').forEach((b) => (b.onclick = () => {
      if (closed.has(b.dataset.dir)) closed.delete(b.dataset.dir); else closed.add(b.dataset.dir)
      host.dataset.at = b.dataset.dir
      draw(host, opts)
    }))
    // A box under the project name, filled with the folder you're in. Enter makes it, Esc cancels.
    if (onNew) host.querySelectorAll('.ft-plus').forEach((btn) => (btn.onclick = () => {
      const folder = btn.dataset.kind === 'folder'
      host.querySelector('.ft-name')?.remove()
      const box = document.createElement('input')
      box.className = 'ft-name'
      box.spellcheck = false
      box.setAttribute('aria-label', folder ? 'New folder path' : 'New file path')
      box.placeholder = folder ? 'src/components/Button' : 'src/components/Button/Button.jsx'
      box.value = host.dataset.at ? host.dataset.at + '/' : active && active.includes('/') ? active.slice(0, active.lastIndexOf('/') + 1) : 'src/'
      host.querySelector('.ft-head').after(box)
      box.focus()
      box.onkeydown = (e) => {
        e.stopPropagation()
        if (e.key === 'Escape') box.remove()
        if (e.key !== 'Enter') return
        const path = clean(box.value).replace(folder ? /\/$/ : /$^/, '')
        if (!path || path.endsWith('/') || files.includes(path) && folder) return box.classList.add('bad')
        box.remove()
        if (folder) { closed.delete(path); host.dataset.at = path }
        onNew(path, folder)
      }
      box.oninput = () => box.classList.remove('bad')
      box.onblur = () => setTimeout(() => box.remove(), 0)
    }))
    host.querySelectorAll('.ft-file').forEach((b) => (b.onclick = () => { b.blur(); delete host.dataset.at; if (onPick) onPick(b.dataset.file) }))
  }

  window.FileTree = { draw }
})()
