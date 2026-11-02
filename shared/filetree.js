// A VS Code style file tree: folders first, then files, A to Z. Used by the slide editor and the Code Explorer.
//   FileTree.draw(host, { files, images, active, fresh, closed, onPick })
//   files: paths that open; images: paths that can't; fresh: a Set shown green; closed: a Set of folded folders
(() => {
  const PROJECT = 'pokemon-app'
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const byName = (a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })

  function nest(paths) {
    const root = { dirs: {}, files: [] }
    for (const p of paths) {
      const parts = p.split('/')
      const name = parts.pop()
      let at = root
      for (const d of parts) at = at.dirs[d] || (at.dirs[d] = { dirs: {}, files: [] })
      at.files.push({ name, path: p })
    }
    return root
  }

  function draw(host, { files, images = [], active, fresh = new Set(), closed = new Set(), onPick }) {
    const canOpen = new Set(files)
    // npm makes this folder; students will see it, and never edit it
    const made = files.includes('package.json') ? '<span class="ft-row ft-off" style="--d:1" title="Made by npm install. You never edit it.">▸ node_modules</span>' : ''
    const dir = (node, base, depth) => {
      const folders = Object.keys(node.dirs).sort(byName).map((d) => {
        const p = base ? base + '/' + d : d
        const shut = closed.has(p)
        return `<button type="button" class="ft-row ft-dir" style="--d:${depth}" data-dir="${esc(p)}" aria-expanded="${!shut}">${shut ? '▸' : '▾'} ${esc(d)}</button>` +
          `<div class="ft-kids"${shut ? ' hidden' : ''}>${dir(node.dirs[d], p, depth + 1)}</div>`
      }).join('')
      const leaves = node.files.sort((a, b) => byName(a.name, b.name)).map((f) => canOpen.has(f.path)
        ? `<button type="button" class="ft-row ft-file${f.path === active ? ' on' : ''}${fresh.has(f.path) ? ' new' : ''}" style="--d:${depth}" data-file="${esc(f.path)}" title="${esc(f.path)}">${esc(f.name)}</button>`
        : `<span class="ft-row ft-off" style="--d:${depth}" title="${esc(f.path)}">${esc(f.name)}</span>`).join('')
      return (depth === 1 ? made : '') + folders + leaves
    }
    host.innerHTML = `<div class="ft"><div class="ft-row ft-root" style="--d:0">${PROJECT}</div>${dir(nest([...files, ...images]), '', 1)}</div>`
    host.querySelectorAll('.ft-dir').forEach((b) => (b.onclick = () => {
      if (closed.has(b.dataset.dir)) closed.delete(b.dataset.dir); else closed.add(b.dataset.dir)
      draw(host, { files, images, active, fresh, closed, onPick })
    }))
    host.querySelectorAll('.ft-file').forEach((b) => (b.onclick = () => { b.blur(); if (onPick) onPick(b.dataset.file) }))
  }

  window.FileTree = { draw }
})()
