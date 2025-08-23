// ===== 共通ユーティリティ =====
function esc(s){ return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// works.json の1件から “サムネURL” を返す（thumb がフルパスでもOK）
function getThumbUrl(item){
  // item.thumb があればそれを優先（"thumbs/xxx.jpg" など相対パス想定）
  if (item && item.thumb) return item.thumb;
  // なければ原寸を使う
  return item?.image || '';
}

// works.json の1件から “原寸URL” を返す（image は "images/xxx.jpg" など）
function getImageUrl(item){
  return item?.image || '';
}

// 作品の識別子（詳細ページに渡す値）を決める
function getWorkKey(item){
  return item.id || (item.image ? item.image.split('/').pop() : (item.title || ''));
}

// ===== ホーム（#latest）: 新着3件 =====
document.addEventListener('DOMContentLoaded', function(){
  const latest = document.getElementById('latest');
  if (!latest) return; // ホーム以外ではスキップ

  fetch('data/works.json', {cache:'no-store'})
    .then(r => r.ok ? r.json() : [])
    .then(list => {
      const works = Array.isArray(list) ? list : [list];
      // 日付降順で3件
      const items = works
        .slice()
        .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))
        .slice(0,3);

      if (!items.length){
        latest.innerHTML = '<div class="card">作品がまだありません。</div>';
        return;
      }

      latest.innerHTML = items.map(item => {
        const key = encodeURIComponent(getWorkKey(item));
        const sub = [item.location || '', item.date ? String(item.date).slice(0,10) : '']
          .filter(Boolean).join(' / ');
        return `
          <a class="card item" href="detail.html?id=${key}">
            <div class="thumb-wrap" style="aspect-ratio:4/3;overflow:hidden;border-radius:12px;">
              <img
                src="${getThumbUrl(item)}"
                srcset="${getThumbUrl(item)} 1x, ${getImageUrl(item)} 2x"
                sizes="(max-width: 640px) 100vw, 33vw"
                alt="${esc(item.title || '')}"
                style="width:100%;height:100%;object-fit:cover;display:block;"
                loading="lazy" decoding="async">
            </div>
            <div class="meta">
              <div class="title">${esc(item.title || '')}</div>
              <div class="sub" style="color:var(--muted)">${esc(sub)}</div>
            </div>
          </a>
        `;
      }).join('');
    })
    .catch(()=> {
      latest.innerHTML = '<div class="card">新着の読み込みに失敗しました。</div>';
    });
});

// ===== 作品一覧（#grid） =====
document.addEventListener('DOMContentLoaded', function(){
  const grid    = document.getElementById('grid');
  if (!grid) return; // ギャラリー以外ではスキップ
  const searchEl = document.getElementById('search');
  const yearEl   = document.getElementById('year');
  const tagEl    = document.getElementById('tag');
  const pagerEl  = document.getElementById('pager');

  let works = [], filtered = [];
  let page = 1;
  const pageSize = 12;

  fetch('data/works.json', {cache:'no-store'})
    .then(r => r.ok ? r.json() : [])
    .then(list => {
      works = Array.isArray(list) ? list : [list];
      buildFilters(works);
      applyFilters();
      searchEl?.addEventListener('input', onFilter);
      yearEl?.addEventListener('change', onFilter);
      tagEl?.addEventListener('change', onFilter);
    })
    .catch(()=>{
      grid.innerHTML = '<div class="card">作品データ（data/works.json）が読み込めませんでした。</div>';
    });

  function onFilter(){ page = 1; applyFilters(); }

  function buildFilters(list){
    const years = new Set(), tags = new Set();
    list.forEach(x => {
      if (x.date) years.add(String(x.date).slice(0,4));
      if (Array.isArray(x.tags)) x.tags.forEach(t => tags.add(String(t)));
    });
    if (yearEl){
      const ys = [...years].sort((a,b)=>b.localeCompare(a));
      yearEl.innerHTML = '<option value="">年で絞り込む</option>' + ys.map(y=>`<option value="${y}">${y}年</option>`).join('');
    }
    if (tagEl){
      const ts = [...tags].sort((a,b)=>a.localeCompare(b));
      tagEl.innerHTML = '<option value="">タグで絞り込む</option>' + ts.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
    }
  }

  function applyFilters(){
    const q  = (searchEl?.value || '').trim().toLowerCase();
    const yy = (yearEl?.value || '').trim();
    const tg = (tagEl?.value || '').trim();
    filtered = works.filter(x => {
      if (yy && (!x.date || String(x.date).slice(0,4) !== yy)) return false;
      if (tg && (!Array.isArray(x.tags) || !x.tags.map(String).includes(tg))) return false;
      if (q){
        const hay = [
          x.title, x.description, x.location, x.paper, x.medium, x.size,
          ...(Array.isArray(x.tags) ? x.tags : [])
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    renderPage();
  }

  function renderPage(){
    const total = filtered.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) page = maxPage;
    const slice = filtered.slice((page-1)*pageSize, (page)*pageSize);

    if (!slice.length){
      grid.innerHTML = '<div class="card">条件に一致する作品がありません。</div>';
      pagerEl.innerHTML = '';
      return;
    }

    grid.innerHTML = slice.map(item => {
      const key = encodeURIComponent(getWorkKey(item));
      const sub = [item.location || '', item.date ? String(item.date).slice(0,10) : '']
        .filter(Boolean).join(' / ');
      return `
        <a class="card item" href="detail.html?id=${key}" aria-label="${esc(item.title || '')}">
          <div class="thumb-wrap" style="aspect-ratio:4/3;overflow:hidden;border-radius:12px;">
            <img
              src="${getThumbUrl(item)}"
              srcset="${getThumbUrl(item)} 1x, ${getImageUrl(item)} 2x"
              sizes="(max-width: 640px) 50vw, 25vw"
              alt="${esc(item.title || '')}"
              style="width:100%;height:100%;object-fit:cover;display:block;"
              loading="lazy" decoding="async">
          </div>
          <div class="meta">
            <div class="title">${esc(item.title || '')}</div>
            <div class="sub" style="color:var(--muted)">${esc(sub)}</div>
          </div>
        </a>
      `;
    }).join('');

    // ページャ
    const max = maxPage;
    pagerEl.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;justify-content:center;margin-top:14px;">
        <button class="btn-prev" ${page<=1?'disabled':''}>前へ</button>
        <span>${page} / ${max}</span>
        <button class="btn-next" ${page>=max?'disabled':''}>次へ</button>
      </div>
    `;
    pagerEl.querySelector('.btn-prev')?.addEventListener('click', ()=>{ if(page>1){ page--; renderPage(); } });
    pagerEl.querySelector('.btn-next')?.addEventListener('click', ()=>{ if(page<max){ page++; renderPage(); } });
  }
});
