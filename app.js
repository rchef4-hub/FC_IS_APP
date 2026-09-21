document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  
  // Forcer l'absence de cache sur tous les chargements de fichiers
  function fetchFresh(url) {
    return fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
  }

  // --- HELPER FORMAT UNIQUE : "NOM Prénom" ---
  function getPlayerFullName(p) {
    if (!p) return '';
    const nom = (p.nom || p.Nom || '').trim().toUpperCase();
    let prenom = (p.prenom || p.Prenom || p.prénom || '').trim();
    if (prenom.length > 0) {
      prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase();
    }
    return prenom ? `${nom} ${prenom}` : nom;
  }

  function formatScoreColor(scoreStr) {
    if (!scoreStr) return '';
    let str = typeof scoreStr === 'object' 
      ? `${scoreStr.scoreDom ?? '-'} - ${scoreStr.scoreExt ?? '-'}` 
      : scoreStr;
    const lower = str.toLowerCase();
    
    if (lower.includes('victoire')) return `<span style="color: #28a745; font-weight: bold;">${str}</span>`;
    if (lower.includes('nul')) return `<span style="color: #fd7e14; font-weight: bold;">${str}</span>`;
    if (lower.includes('défaite') || lower.includes('defaite')) return `<span style="color: #6b0f40; font-weight: bold;">${str}</span>`;
    
    return `<strong>${str}</strong>`;
  }

  function getPosteColor(posteStr) {
    if (!posteStr) return '#6c757d'; 
    const p = posteStr.toLowerCase();
    if (p.includes('gardien') || p.includes('gb')) return '#28a745';
    if (p.includes('défenseur') || p.includes('def')) return '#17a2b8';
    if (p.includes('milieu')) return '#fd7e14';
    if (p.includes('attaquant') || p.includes('att')) return '#c9a227';
    return '#6c757d';
  }

  // --- PAGE D'ACCUEIL ---
  async function renderHome() {
    let bdaysHTML = '<p style="text-align:center; color:#666;">Aucun anniversaire ce mois-ci 🎉</p>';
    let lastMatchHTML = '<p style="text-align:center; color:#666;">Aucun résultat récent</p>';
    let nextMatchHTML = '<p style="text-align:center; color:#666;">Aucun match à venir</p>';

    const loadJsonSafe = async (filename) => {
      try {
        const res = await fetchFresh(filename);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn(`Fichier ${filename} introuvable.`, e);
      }
      return [];
    };

    const [players, dirigeants, arbitres] = await Promise.all([
      loadJsonSafe('players.json'),
      loadJsonSafe('dirigeants.json'),
      loadJsonSafe('arbitres.json')
    ]);

    const rawMembers = [...players, ...dirigeants, ...arbitres];
    const uniqueKeys = new Set();
    
    const allMembers = rawMembers.filter(m => {
      const fullName = getPlayerFullName(m);
      if (!fullName) return false;
      m.dateNaissanceValidee = m.naissance || m.date_de_naissance || m.Naissance;
      if (uniqueKeys.has(fullName)) return false;
      uniqueKeys.add(fullName);
      return true;
    });

    if (allMembers.length > 0) {
      const currentMonth = new Date().getMonth() + 1;
      const monthBDays = allMembers.filter(m => {
        const dateStr = m.dateNaissanceValidee;
        if (!dateStr) return false;
        const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
        if (parts.length < 3) return false;
        return parseInt(parts[1], 10) === currentMonth;
      });

      if (monthBDays.length > 0) {
        bdaysHTML = monthBDays.map(m => {
          const dateStr = m.dateNaissanceValidee;
          const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
          const isISO = parts[0].length === 4;
          const day = isISO ? parts[2].padStart(2, '0') : parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          return `
            <li style="padding: 10px 12px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; list-style: none; border-left: 4px solid var(--accent-color, #ffc107);">
              <span>${m.symbole || '🎂'} <strong>${getPlayerFullName(m)}</strong></span>
              <small style="color: var(--primary-color, #007bff); font-weight: bold;">${day}/${month}</small>
            </li>
          `;
        }).join('');
        bdaysHTML = `<ul style="padding: 0; margin: 0;">${bdaysHTML}</ul>`;
      }
    }

    try {
      const resMatchs = await fetchFresh('matchs.json');
      if (resMatchs.ok) {
        const matches = await resMatchs.json();
        const playedMatches = matches.filter(m => m.resultat && m.resultat !== "");
        if (playedMatches.length > 0) {
          const lastMatch = playedMatches[playedMatches.length - 1];
          let detailsHTML = '';
          if (lastMatch.buteurs) detailsHTML += `<div style="font-size: 0.9em; color: #444; margin-top: 6px;">⚽ <strong>Buteur(s) :</strong> ${lastMatch.buteurs}</div>`;
          if (lastMatch.passeurs) detailsHTML += `<div style="font-size: 0.9em; color: #444; margin-top: 4px;">👟 <strong>Passeur(s) :</strong> ${lastMatch.passeurs}</div>`;

          lastMatchHTML = `
            <div style="text-align: center;">
              <small style="color: #666; font-weight: bold;">📅 ${lastMatch.date} (${lastMatch.lieu || 'N/C'})</small>
              <div style="font-size: 1.1em; margin: 5px 0;"><strong>vs ${lastMatch.adversaire}</strong></div>
              <div style="font-size: 1.1em;">Score : ${formatScoreColor(lastMatch.resultat)}</div>
              ${detailsHTML}
            </div>
          `;
        }

        const upcomingMatches = matches.filter(m => !m.resultat || m.resultat === "");
        if (upcomingMatches.length > 0) {
          const nextMatch = upcomingMatches[0];
          const badgeColor = (nextMatch.lieu && nextMatch.lieu.toLowerCase().includes('domicile')) ? '#28a745' : '#17a2b8';
          nextMatchHTML = `
            <div style="text-align: center;">
              <small style="color: #666; font-weight: bold;">📅 ${nextMatch.date}</small>
              <div style="font-size: 1.1em; margin: 5px 0;"><strong>vs ${nextMatch.adversaire}</strong></div>
              <span style="background: ${badgeColor}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.85em;">${nextMatch.lieu || 'N/C'}</span>
            </div>
          `;
        }
      }
    } catch (e) {
      console.error("Erreur chargement accueil :", e);
    }

    root.innerHTML = `
      <h1>Bienvenue au F.C. IS</h1>
      <div style="text-align:center; margin: 20px 0;"><p><em>Saison 2026-2027</em></p></div>

      <a href="https://team.jako.com/fr-fr/team/fc_is/" target="_blank" rel="noopener noreferrer" 
         style="display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, #6b0f40, #8b1453); color: white; text-decoration: none; padding: 12px 16px; border-radius: 10px; margin-bottom: 25px; font-weight: bold;">
        <span>🛍️ Boutique Officielle JAKO</span>
        <span style="background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; font-size: 0.85em;">Visiter ↗</span>
      </a>

      <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
        <div style="background: #6b0f40; color: white; text-align: center; padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 15px;">⚽ Dernier Match</div>
        ${lastMatchHTML}
      </div>

      <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
        <div style="background: #6b0f40; color: white; text-align: center; padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 15px;">⏳ Prochain Match</div>
        ${nextMatchHTML}
      </div>

      <div style="background: white; padding: 15px; border-radius: 12px;">
        <div style="background: #6b0f40; color: white; text-align: center; padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 15px;">🎉 Anniversaires du mois</div>
        ${bdaysHTML}
      </div>
    `;
  }

  // --- CALENDRIER ---
  async function renderMatches() {
    root.innerHTML = `<h2>Calendrier & Résultats</h2><p style="text-align: center;">Chargement...</p>`;
    try {
      const res = await fetchFresh('matchs.json');
      const matches = await res.json();

      const matchesHTML = matches.map(m => {
        const isDomicile = m.lieu && m.lieu.toLowerCase().includes('domicile');
        const badgeColor = isDomicile ? '#28a745' : '#17a2b8';
        
        let detailsHTML = '';
        if (m.buteurs) detailsHTML += `<div style="font-size: 0.85em; color: #555; margin-top: 4px;">⚽ <strong>Buteurs :</strong> ${m.buteurs}</div>`;
        if (m.passeurs) detailsHTML += `<div style="font-size: 0.85em; color: #555; margin-top: 2px;">👟 <strong>Passeurs :</strong> ${m.passeurs}</div>`;

        return `
          <li style="border-left-color: ${badgeColor}; padding: 12px; margin-bottom: 10px; background: white; border-radius: 8px; list-style: none; box-shadow: var(--shadow);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <small style="color: #666; font-weight: bold;">📅 ${m.date}</small>
              <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">${m.lieu || 'N/C'}</span>
            </div>
            <div style="font-size: 1.1em; margin-bottom: 5px;"><strong>vs ${m.adversaire}</strong></div>
            <div>Score : ${m.resultat ? formatScoreColor(m.resultat) : '<em>À venir</em>'}</div>
            ${detailsHTML}
          </li>
        `;
      }).join('');

      root.innerHTML = `<h2>Calendrier & Résultats</h2><ul style="padding: 0;">${matchesHTML}</ul>`;
    } catch (e) {
      root.innerHTML = `<h2>Calendrier & Résultats</h2><p style="color: red; text-align: center;">Erreur de chargement.</p>`;
    }
  }

  // --- STATISTIQUES ---
  async function renderStats() {
    root.innerHTML = `<h2>Statistiques</h2><p style="text-align: center;">Chargement...</p>`;
    try {
      const res = await fetchFresh('players.json');
      const players = await res.json();

      // Tolérance sur la clé de présence (matchs ou matches)
      const getNbMatchs = p => parseInt(p.matchs ?? p.matches ?? 0, 10) || 0;
      const getNbButs = p => parseInt(p.buts ?? 0, 10) || 0;
      const getNbPasses = p => parseInt(p.passes ?? 0, 10) || 0;
      const getJaunes = p => parseInt(p.cartons_jaunes ?? 0, 10) || 0;
      const getBlancs = p => parseInt(p.cartons_blancs ?? 0, 10) || 0;
      const getRouges = p => parseInt(p.cartons_rouges ?? 0, 10) || 0;

      const topScorers = [...players].filter(p => getNbButs(p) > 0).sort((a, b) => getNbButs(b) - getNbButs(a));
      const topPassers = [...players].filter(p => getNbPasses(p) > 0).sort((a, b) => getNbPasses(b) - getNbPasses(a));
      const topCards = [...players].filter(p => getJaunes(p) > 0 || getBlancs(p) > 0 || getRouges(p) > 0);
      const topPlayed = [...players].filter(p => getNbMatchs(p) > 0).sort((a, b) => getNbMatchs(b) - getNbMatchs(a));

      const renderList = (arr, labelFn, emptyMsg) => arr.length > 0 ? arr.map(p => `
        <li>
          <strong>${getPlayerFullName(p)}</strong><br><small>${labelFn(p)}</small>
        </li>
      `).join('') : `<p style="padding: 10px; color: #666; text-align: center;">${emptyMsg}</p>`;

      root.innerHTML = `
        <h2>Statistiques de la Saison</h2>
        <h3 class="accordion-header">⚽ Meilleurs Buteurs</h3>
        <ul class="collapsed">${renderList(topScorers, p => `⚽ ${getNbButs(p)} but(s) en${getNbMatchs(p)} match(s)`, "Aucun buteur")}</ul>
        
        <h3 class="accordion-header">👟 Meilleurs Passeurs</h3>
        <ul class="collapsed">${renderList(topPassers, p => `👟 ${getNbPasses(p)} passe(s)`, "Aucune passe décisive")}</ul>
        
        <h3 class="accordion-header">⬜🟨🟥 Discipline</h3>
        <ul class="collapsed">${renderList(topCards, p => `🟨 ${getJaunes(p)} | ⬜ ${getBlancs(p)} \vert{} 🟥 ${getRouges(p)}`, "Aucun carton")}</ul>
        
        <h3 class="accordion-header">🏃 Joueurs les plus utilisés</h3>
        <ul class="collapsed">${renderList(topPlayed, p => `🏃 ${getNbMatchs(p)} match(s)`, "Aucun match enregistré")}</ul>
      `;

      document.querySelectorAll('#root h3.accordion-header').forEach(header => {
        header.addEventListener('click', function() {
          const list = this.nextElementSibling;
          if (list && list.tagName === 'UL') {
            list.classList.toggle('collapsed'); 
            this.classList.toggle('active');
          }
        });
      });
    } catch (e) {
      root.innerHTML = `<h2>Statistiques</h2><p style="color: red; text-align: center;">Erreur de chargement.</p>`;
    }
  }

  // --- EFFECTIF ---
  async function renderPlayers() {
    root.innerHTML = `<h2>Effectif du Club</h2><p style="text-align: center;">Chargement...</p>`;
    try {
      const [players, dirigeants, arbitres] = await Promise.all([
        fetchFresh('players.json').then(r => r.ok ? r.json() : []),
        fetchFresh('dirigeants.json').then(r => r.ok ? r.json() : []),
        fetchFresh('arbitres.json').then(r => r.ok ? r.json() : [])
      ]);

      let html = '<h2>Effectif du Club</h2>';

      if (players.length > 0) {
        const list = players.map(p => `<li style="border-left: 4px solid ${getPosteColor(p.poste)};">${p.symbole || '⚽'} <strong>${p.numero ? '#' + p.numero + ' ' : ''}${getPlayerFullName(p)}</strong><br><small>${p.poste || ''}</small></li>`).join('');
        html += `<h3 class="accordion-header">⚽ Joueurs</h3><ul class="collapsed">${list}</ul>`;
      }
      if (dirigeants.length > 0) {
        const list = dirigeants.map(d => `<li style="border-left: 4px solid #6c757d;">${d.symbole || '👔'} <strong>${getPlayerFullName(d)}</strong><br><small>${d.fonction || ''}</small></li>`).join('');
        html += `<h3 class="accordion-header">👔 Dirigeants</h3><ul class="collapsed">${list}</ul>`;
      }
      if (arbitres.length > 0) {
        const list = arbitres.map(a => `<li style="border-left: 4px solid #6c757d;">${a.symbole || '🟨'} <strong>${getPlayerFullName(a)}</strong><br><small>Arbitre ${a.categorie || 'Club'}</small></li>`).join('');
        html += `<h3 class="accordion-header">🟨🟥 Arbitres</h3><ul class="collapsed">${list}</ul>`;
      }

      root.innerHTML = html;

      document.querySelectorAll('#root h3').forEach(header => {
        header.addEventListener('click', function() {
          const list = this.nextElementSibling;
          if (list && list.tagName === 'UL') {
            list.classList.toggle('collapsed'); 
            this.classList.toggle('active');
          }
        });
      });
    } catch (e) {
      root.innerHTML = `<h2>Effectif du Club</h2><p style="color: red; text-align: center;">Erreur de chargement.</p>`;
    }
  }

  // --- ANNONCES ---
  async function renderAnnouncements() {
    root.innerHTML = `<h2>Annonces Club</h2><p style="text-align: center;">Chargement...</p>`;
    try {
      const res = await fetchFresh('annonces.json');
      const annonces = await res.json();
      const list = annonces.map(a => `
        <li style="border-left-color: ${a.couleur_bordure || 'var(--primary-color)'};">
          ${a.symbole || '📢'} <strong>${a.titre}</strong><br>${a.details}
        </li>
      `).join('');
      root.innerHTML = `<h2>Annonces Club</h2><ul>${list}</ul>`;
    } catch (e) {
      root.innerHTML = `<h2>Annonces Club</h2><p style="color: red; text-align: center;">Erreur de chargement.</p>`;
    }
  }

  // --- ADMINISTRATION ---
  async function renderAdmin() {
    const password = prompt("Veuillez entrer le mot de passe administrateur :");
    if (password !== "508497") {
      alert("Mot de passe incorrect !");
      window.location.hash = "home";
      return;
    }

    let githubToken = localStorage.getItem('fcis_github_token');
    if (!githubToken) {
      githubToken = prompt("Entrez votre Token GitHub (ghp_...) :");
      if (githubToken) {
        localStorage.setItem('fcis_github_token', githubToken);
      } else {
        alert("Token nécessaire.");
        window.location.hash = "home";
        return;
      }
    }

    const REPO_OWNER = "rchef4-hub";
    const REPO_NAME = "FC_IS_APP";

    root.innerHTML = `<h2>⚙️ Saisie de Match</h2><p style="text-align: center;">Chargement des données...</p>`;

    try {
      const [playersRes, matchesRes] = await Promise.all([
        fetchFresh('players.json'),
        fetchFresh('matchs.json')
      ]);

      const players = await playersRes.json();
      const matches = await matchesRes.json();

      let goalEvents = [];
      let cardEvents = [];

      let matchOptions = matches.map((m, idx) => 
        `<option value="${idx}">${m.date} - vs ${m.adversaire} (${m.lieu})</option>`
      ).join('');

      let playerOptionsScorer = `<option value="CSC">[CSC] But contre son camp</option>` + players.map(p => {
        const name = getPlayerFullName(p);
        return `<option value="${name}">${name}</option>`;
      }).join('');

      let playerOptionsPasser = players.map(p => {
        const name = getPlayerFullName(p);
        return `<option value="${name}">${name}</option>`;
      }).join('');

      let playerCheckboxList = players.map(p => {
        const name = getPlayerFullName(p);
        return `
          <label style="display:block; margin: 5px 0; font-size: 0.95em;">
            <input type="checkbox" class="presence-check" value="${name}">
            #${p.numero || ''} ${name} (${p.poste || ''})
          </label>
        `;
      }).join('');

      root.innerHTML = `
        <h2>⚙️ Saisie d'un Match</h2>
        <div style="background: white; padding: 15px; border-radius: 12px; box-shadow: var(--shadow);">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">1. Sélectionner le match :</label>
          <select id="select-match" style="width: 100%; padding: 8px; margin-bottom: 15px; border-radius: 6px;">
            ${matchOptions}
          </select>

          <label style="font-weight: bold; display: block; margin-bottom: 5px;">2. Score final :</label>
          <input type="text" id="match-score" placeholder="Ex: Victoire 3 - 0 ou Défaite 1 - 2" style="width: 100%; padding: 8px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #ccc;">

          <label style="font-weight: bold; display: block; margin-bottom: 5px;">3. Joueurs Présents :</label>
          <div style="max-height: 150px; overflow-y: auto; background: #f8f9fa; padding: 8px; border-radius: 6px; margin-bottom: 15px;">
            ${playerCheckboxList}
          </div>

          <label style="font-weight: bold; display: block; margin-bottom: 5px;">4. Ajouter Buteur / Passeur :</label>
          <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            <select id="select-buteur" style="flex: 1; padding: 6px; border-radius: 6px;">
              <option value="">-- Buteur --</option>
              ${playerOptionsScorer}
            </select>
            <select id="select-passeur" style="flex: 1; padding: 6px; border-radius: 6px;">
              <option value="">-- Passeur --</option>
              ${playerOptionsPasser}
            </select>
            <button id="btn-add-goal" type="button" style="background: var(--primary-color, #007bff); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">+ Ajouter</button>
          </div>

          <label style="font-weight: bold; display: block; margin-bottom: 5px;">5. Ajouter un Carton :</label>
          <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            <select id="select-joueur-carton" style="flex: 1; padding: 6px; border-radius: 6px;">
              <option value="">-- Joueur --</option>
              ${playerOptionsPasser}
            </select>
            <select id="select-type-carton" style="width: 140px; padding: 6px; border-radius: 6px;">
              <option value="🟨">🟨 Jaune</option>
              <option value="⬜">⬜ Blanc</option>
              <option value="🟥">🟥 Rouge</option>
            </select>
            <button id="btn-add-card" type="button" style="background: #ffc107; color: black; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">+ Ajouter</button>
          </div>

          <div id="goals-list" style="margin-bottom: 10px;"></div>
          <div id="cards-list" style="margin-bottom: 15px;"></div>

          <button id="btn-save-direct" type="button" style="width: 100%; background: #28a745; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 1em; cursor: pointer; margin-bottom: 15px;">
            🚀 Publier le match sur GitHub
          </button>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

          <button id="btn-reset-all" type="button" style="width: 100%; background: #dc3545; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 0.9em; cursor: pointer;">
            🔄 Remettre à ZÉRO les statistiques & résultats
          </button>

          <p id="status-message" style="text-align:center; font-weight:bold; margin-top:10px;"></p>
        </div>
      `;

      function renderGoalsUI() {
        const container = document.getElementById('goals-list');
        if (goalEvents.length === 0) {
          container.innerHTML = `<small style="color: #888;">Aucun but ajouté.</small>`;
          return;
        }
        container.innerHTML = goalEvents.map((e, idx) => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 8px 12px; border-radius: 8px; margin-bottom: 5px; border-left: 4px solid #ffc107;">
            <span>⚽ <strong>${e.buteur}</strong> ${e.passeur ? '<small>(passe : ' + e.passeur + ')</small>' : ''}</span>
            <button type="button" class="btn-remove-goal" data-idx="${idx}" style="background:none; border:none; color:red; cursor:pointer;">❌</button>
          </div>
        `).join('');

        document.querySelectorAll('.btn-remove-goal').forEach(btn => {
          btn.addEventListener('click', (ev) => {
            const idx = parseInt(ev.target.getAttribute('data-idx'), 10);
            goalEvents.splice(idx, 1);
            renderGoalsUI();
          });
        });
      }

      function renderCardsUI() {
        const container = document.getElementById('cards-list');
        if (cardEvents.length === 0) {
          container.innerHTML = `<small style="color: #888;">Aucun carton ajouté.</small>`;
          return;
        }
        container.innerHTML = cardEvents.map((c, idx) => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 8px 12px; border-radius: 8px; margin-bottom: 5px; border-left: 4px solid #ffc107;">
            <span>${c.type} <strong>${c.joueur}</strong></span>
            <button type="button" class="btn-remove-card" data-idx="${idx}" style="background:none; border:none; color:red; cursor:pointer;">❌</button>
          </div>
        `).join('');

        document.querySelectorAll('.btn-remove-card').forEach(btn => {
          btn.addEventListener('click', (ev) => {
            const idx = parseInt(ev.target.getAttribute('data-idx'), 10);
            cardEvents.splice(idx, 1);
            renderCardsUI();
          });
        });
      }

      renderGoalsUI();
      renderCardsUI();

      document.getElementById('btn-add-goal').addEventListener('click', () => {
        const buteur = document.getElementById('select-buteur').value;
        const passeur = document.getElementById('select-passeur').value;
        if (!buteur) return alert('Sélectionnez un buteur');
        goalEvents.push({ buteur, passeur });
        renderGoalsUI();
        document.getElementById('select-buteur').value = '';
        document.getElementById('select-passeur').value = '';
      });

      document.getElementById('btn-add-card').addEventListener('click', () => {
        const joueur = document.getElementById('select-joueur-carton').value;
        const type = document.getElementById('select-type-carton').value;
        if (!joueur) return alert('Sélectionnez un joueur');
        cardEvents.push({ joueur, type });
        renderCardsUI();
        document.getElementById('select-joueur-carton').value = '';
      });

      async function updateGitHubFile(filePath, newContent, commitMessage) {
        const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
        const getRes = await fetch(getUrl, { headers: { 'Authorization': `token ${githubToken}` } });
        if (!getRes.ok) throw new Error(`Lecture impossible de ${filePath}`);
        const fileData = await getRes.json();

        const putRes = await fetch(getUrl, {
          method: 'PUT',
          headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: commitMessage,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(newContent, null, 2)))),
            sha: fileData.sha
          })
        });
        if (!putRes.ok) throw new Error(`Erreur d'écriture sur ${filePath}`);
      }

      document.getElementById('btn-save-direct').addEventListener('click', async () => {
        const statusMsg = document.getElementById('status-message');
        statusMsg.style.color = "orange";
        statusMsg.innerText = "⏳ Publication sur GitHub...";

        try {
          const selectedMatchIdx = document.getElementById('select-match').value;
          const score = document.getElementById('match-score').value;
          const checkedBoxes = document.querySelectorAll('.presence-check:checked');
          const presentList = Array.from(checkedBoxes).map(cb => cb.value);

          let butsMap = {}, passesMap = {}, jaunesMap = {}, blancsMap = {}, rougesMap = {};

          goalEvents.forEach(e => {
            if (e.buteur && e.buteur !== 'CSC') butsMap[e.buteur] = (butsMap[e.buteur] || 0) + 1;
            if (e.passeur) passesMap[e.passeur] = (passesMap[e.passeur] || 0) + 1;
          });

          cardEvents.forEach(c => {
            if (c.type === '🟨') jaunesMap[c.joueur] = (jaunesMap[c.joueur] || 0) + 1;
            if (c.type === '⬜') blancsMap[c.joueur] = (blancsMap[c.joueur] || 0) + 1;
            if (c.type === '🟥') rougesMap[c.joueur] = (rougesMap[c.joueur] || 0) + 1;
          });

          const updatedPlayers = players.map(p => {
            const fullName = getPlayerFullName(p);
            let updatedP = { ...p };

            if (presentList.includes(fullName)) {
              updatedP.matchs = (parseInt(updatedP.matchs || updatedP.matches, 10) || 0) + 1;
            }
            if (butsMap[fullName]) {
              updatedP.buts = (parseInt(updatedP.buts, 10) || 0) + butsMap[fullName];
            }
            if (passesMap[fullName]) {
              updatedP.passes = (parseInt(updatedP.passes, 10) || 0) + passesMap[fullName];
            }
            if (jaunesMap[fullName]) {
              updatedP.cartons_jaunes = (parseInt(updatedP.cartons_jaunes, 10) || 0) + jaunesMap[fullName];
            }
            if (blancsMap[fullName]) {
              updatedP.cartons_blancs = (parseInt(updatedP.cartons_blancs, 10) || 0) + blancsMap[fullName];
            }
            if (rougesMap[fullName]) {
              updatedP.cartons_rouges = (parseInt(updatedP.cartons_rouges, 10) || 0) + rougesMap[fullName];
            }

            return updatedP;
          });

          matches[selectedMatchIdx].resultat = score;
          matches[selectedMatchIdx].buteurs = goalEvents.map(e => e.buteur).join(', ');
          matches[selectedMatchIdx].passeurs = goalEvents.map(e => e.passeur).filter(Boolean).join(', ');

          await updateGitHubFile('players.json', updatedPlayers, 'Mise à jour des stats joueurs');
          await updateGitHubFile('matchs.json', matches, 'Mise à jour des résultats matchs');

          statusMsg.style.color = "green";
          statusMsg.innerText = "✅ Publication effectuée avec succès !";
        } catch (err) {
          console.error(err);
          statusMsg.style.color = "red";
          statusMsg.innerText = "❌ Erreur : " + err.message;
        }
      });

      document.getElementById('btn-reset-all').addEventListener('click', async () => {
        if (!confirm("⚠️ Tout réinitialiser ?")) return;
        const statusMsg = document.getElementById('status-message');
        statusMsg.style.color = "orange";
        statusMsg.innerText = "⏳ Réinitialisation...";

        try {
          const resetPlayers = players.map(p => ({
            ...p, matchs: 0, buts: 0, passes: 0, cartons_jaunes: 0, cartons_blancs: 0, cartons_rouges: 0
          }));

          const resetMatches = matches.map(m => {
            delete m.resultat;
            delete m.buteurs;
            delete m.passeurs;
            return m;
          });

          await updateGitHubFile('players.json', resetPlayers, 'Reset stats');
          await updateGitHubFile('matchs.json', resetMatches, 'Reset matchs');

          statusMsg.style.color = "green";
          statusMsg.innerText = "✅ Réinitialisation réussie !";
        } catch (err) {
          statusMsg.style.color = "red";
          statusMsg.innerText = "❌ Erreur : " + err.message;
        }
      });

    } catch (error) {
      root.innerHTML = `<h2>⚙️ Saisie de Match</h2><p style="color: red; text-align: center;">Erreur de chargement.</p>`;
    }
  }

  function handleRoute() {
    const hash = window.location.hash.substring(1) || 'home';
    switch (hash) {
      case 'matches': renderMatches(); break;
      case 'stats': renderStats(); break;
      case 'players': renderPlayers(); break;
      case 'announcements': renderAnnouncements(); break;
      case 'admin': renderAdmin(); break;
      case 'home':
      default: renderHome(); break;
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
});
