// file: static/js/pool-security.js
// Модуль для модального вікна перевірки безпеки пулів

window.PoolSec = (function () {
  const modal = () => document.getElementById('pool-sec-modal');
  const body = () => document.getElementById('sec-body');
  const title = () => document.getElementById('sec-title');

  function fmtTON(n) {
    try { 
      return Number(n).toLocaleString('en-US', {maximumFractionDigits: 4}); 
    } catch(_) { 
      return n; 
    }
  }
  
  function fmtUSD(n) {
    try { 
      return '$' + Number(n).toLocaleString('en-US', {maximumFractionDigits: 0}); 
    } catch(_) { 
      return n; 
    }
  }

  function close() { 
    modal().classList.add('hidden'); 
  }
  
  function open(address) {
    console.log('Opening security check for:', address);
    modal().classList.remove('hidden');
    title().textContent = 'Security Check';
    body().innerHTML = '<p>⏳ Завантаження даних безпеки...</p>';
    
    fetch(`/api/pool/${encodeURIComponent(address)}/security`)
      .then(r => {
        console.log('Security API response status:', r.status);
        return r.json();
      })
      .then(data => {
        console.log('Security data:', data);
        render(data);
      })
      .catch(e => { 
        console.error('Security check error:', e); 
        body().innerHTML = '<p class="kv" style="color: #ff8484;"><strong>Помилка:</strong> Не вдалося завантажити дані безпеки.</p>'; 
      });
  }

  function render(d) {
    if (d.error) {
      body().innerHTML = `<p class="kv" style="color: #ff8484;"><strong>Помилка:</strong> ${d.error}</p>`;
      return;
    }
    
    const p = d.pool || {};
    const on = d.onchain || {};
    const owner = d.owner_probe || {};
    const tvl = d.tvl_usd;

    // Бейджі
    const badges = [];
    if (p.type === 'lst') {
      badges.push(`<span class="badge lst">LST (Liquid Staking)</span>`);
    } else {
      badges.push(`<span class="badge native">Native Staking</span>`);
    }
    
    if (Array.isArray(p.audits) && p.audits.length) {
      badges.push(`<span class="badge audit">✓ Аудит</span>`);
    }
    
    if (owner.detected) {
      badges.push(`<span class="badge">✓ Owner detected</span>`);
    }

    title().textContent = `${p.name} · Security Check`;
    
    body().innerHTML = `
      <div class="kv" style="margin-bottom: 12px;">${badges.join(' ')}</div>
      
      <div class="sec-grid">
        <div>
          <h4 style="color: #84d0ff; margin-bottom: 8px;">📋 Контракт і Баланс</h4>
          <div class="kv"><strong>Адреса:</strong><br/><code style="font-size: 0.8em;">${p.address}</code></div>
          <div class="kv"><strong>Code hash:</strong><br/><code style="font-size: 0.8em;">${on.code_hash || '—'}</code></div>
          <div class="kv"><strong>Баланс контракту:</strong> ${on.balance_ton != null ? fmtTON(on.balance_ton) + ' TON' : '—'}</div>
          <div class="kv"><strong>Fee:</strong> ${p.fee != null ? (p.fee * 100).toFixed(1) + ' %' : '—'}</div>
          <div class="kv"><strong>Min stake:</strong> ${p.min_stake_ton != null ? p.min_stake_ton + ' TON' : '—'}</div>
          ${tvl != null ? `<div class="kv"><strong>TVL (DeFiLlama):</strong> ${fmtUSD(tvl)}</div>` : ''}
          ${p.lst_token ? `<div class="kv"><strong>LST Token:</strong> ${p.lst_token}</div>` : ''}
        </div>
        
        <div>
          <h4 style="color: #84d0ff; margin-bottom: 8px;">🔐 Безпека і Документація</h4>
          <div class="kv"><strong>Документація:</strong> <a href="${p.docs_url || '#'}" target="_blank" rel="noopener">Docs →</a></div>
          <div class="kv"><strong>FAQ:</strong> <a href="${p.faq_url || '#'}" target="_blank" rel="noopener">FAQ →</a></div>
          <div class="kv"><strong>Terms of Service:</strong> <a href="${p.tos_url || '#'}" target="_blank" rel="noopener">ToS →</a></div>
          
          ${Array.isArray(p.audits) && p.audits.length ? `
            <div class="kv"><strong>Аудити:</strong>
              <ul class="list">${p.audits.map(u => `<li><a href="${u}" target="_blank" rel="noopener">📄 ${u.split('/').pop()}</a></li>`).join('')}</ul>
            </div>
          ` : `<div class="kv"><strong>Аудити:</strong> Не вказано</div>`}
          
          <div class="kv"><strong>Owner/Multisig:</strong> ${owner.detected ? `<span style="color: #84ffd0;">✓ Виявлено</span> (метод <code>${owner.method}</code>)` : '<span style="color: #ffd084;">? Невідомо</span>'}</div>
          
          ${p.type === 'lst' && p.lst_risk_note ? `
            <div class="kv" style="background: #2a1f1f; padding: 8px; border-radius: 6px; margin-top: 8px;">
              <strong style="color: #ffd084;">⚠️ LST Ризики:</strong><br/>
              <span style="font-size: 0.9em;">${p.lst_risk_note}</span>
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="kv" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1e2a3b;">
        <a href="https://tonviewer.com/${encodeURIComponent(p.address)}" target="_blank" rel="noopener" class="btn btn-secondary">
          🔍 Відкрити в Tonviewer
        </a>
      </div>
      
      ${on.error ? `<p class="kv" style="margin-top: 12px; font-size: 0.9em; color: #ffd084;"><strong>⚠️ Примітка:</strong> Ончейн-дані Toncenter тимчасово недоступні. Показані лише метадані з каталогу.</p>` : ''}
    `;
  }

  // Ініціалізація обробників подій
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHandlers);
  } else {
    initHandlers();
  }
  
  function initHandlers() {
    const btn = document.getElementById('sec-close');
    if (btn) {
      btn.addEventListener('click', close);
    }
    
    const backdrop = document.querySelector('#pool-sec-modal .sec-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', close);
    }
    
    console.log('PoolSec handlers initialized');
  }

  return { open, close };
})();
