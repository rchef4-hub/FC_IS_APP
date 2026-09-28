document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  
  // --- GESTION DES FETCH ROBUSTE ---
  // Utilise les en-têtes et options natifs pour forcer le non-cache
  function fetchFresh(url) {
    return fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  // Fonction utilitaire pour charger du JSON avec gestion d'erreur centralisée
  async function loadJson(filename, defaultValue = []) {
    try {
      const res = await fetchFresh(filename);
      if (!res.ok) {
        console.warn(`Fichier ${filename} introuvable ou erreur HTTP ${res.status}`);
        return defaultValue;
      }
      return await res.json();
    } catch (e) {
      console.error(`Erreur lors du chargement de ${filename}:`, e);
      return defaultValue;
    }
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

    // Chargement des données membres
    const [rawMembers] = await Promise.all([
      loadJsonSafe('membres.json') // Adapte le nom du fichier si nécessaire
    ]);

    const uniqueKeys = new Set();
    
    const allMembers = rawMembers.filter(m => {
      const fullName = getPlayerFullName(m);
      if (!fullName) return false;
      
      const dateStr = m.naissance || m.date_de_naissance || m.Naissance;
      if (!dateStr) return false;
      m.dateNaissanceValidee = dateStr;

      // Normalisation pour fusionner les doublons
      const cleanName = fullName.replace(/\s+/g, ' ').trim().toUpperCase();
      const cleanDate = dateStr.trim();
      const uniqueIdentifier = `${cleanName}_${cleanDate}`;

      if (uniqueKeys.has(uniqueIdentifier)) return false;
      uniqueKeys.add(uniqueIdentifier);
      return true;
    });

    if (allMembers.length > 0) {
      const currentMonth = new Date().getMonth() + 1;
      const monthBDays = allMembers.filter(m => {
        const dateStr = m.dateNaissanceValidee;
        const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
        if (parts.length < 3) return false;
        return parseInt(parts, 10) === currentMonth;
      });

      monthBDays.sort((a, b) => {
        const getDay = (item) => {
          const p = item.dateNaissanceValidee.includes('/') ? item.dateNaissanceValidee.split('/') : item.dateNaissanceValidee.split('-');
          return parseInt(p.length === 4 ? p : p, 10);
        };
        return getDay(a) - getDay(b);
      });

      if (monthBDays.length > 0) {
        bdaysHTML = monthBDays.map(m => {
          const dateStr = m.dateNaissanceValidee;
          const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
          const isISO = parts.length === 4;
          const day = isISO ? parts.padStart(2, '0') : parts.padStart(2, '0');
          const month = parts.padStart(2, '0');
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

    // Chargement des matchs pour l'accueil
    const matches = await loadJson('matchs.json');

    if (matches.length > 0) {
      // Trier par date (supposant un format lisible par Date)
      const sortedMatches = matches.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Dernier match joué
      const lastPlayed = sortedMatches.find(m => m.resultat);
      if (lastPlayed) {
        lastMatchHTML = `
          <div style="padding: 10px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
            <small style="color: #666;">Dernier match : ${lastPlayed.date} - ${lastPlayed.lieu}</small><br>
            <strong>vs ${lastPlayed.adversaire}</strong><br>
            Score : ${formatScoreColor(lastPlayed.resultat)}
            ${lastPlayed.buteurs ? `<br><small>Buteurs : ${lastPlayed.buteurs}</small>` : ''}
          </div>
        `;
      }

      // Prochain match
      const nextMatch = sortedMatches.find(m => !m.resultat);
      if (nextMatch) {
        nextMatchHTML = `
          <div style="padding: 10px; background: #f8f9fa; border-radius: 8px;">
            <small style="color: #666;">Prochain match : ${nextMatch.date} - ${nextMatch.lieu}</small><br>
            <strong>vs ${nextMatch.adversaire}</strong>
          </div>
        `;
      }
    }

    // Affichage final
    root.innerHTML = `
      <h2>Accueil</h2>
      <h3>🎂 Anniversaires du mois</h3>
      ${bdaysHTML}
      
      <h3>📅 Dernier Match</h3>
      ${lastMatchHTML}
      
      <h3>🏆 Prochain Match</h3>
      ${nextMatchHTML}
    `;
  }

  // --- CALENDRIER ---
  async function renderMatches() {
    root.innerHTML = `<h2>Calendrier & Résultats</h2><p style="text-align: center;">Chargement...</p>`;
    try {
      const matches = await loadJson('matchs.json');

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
      const players = await loadJson('players.json');

      const getNbMatchs = p => parseInt(p.matchs ?? p.matches ?? 0, 10) || 0;
      const getNbButs = p => parseInt(p.buts ?? 0, 10) || 0;
      const getNbPasses = p => parseInt(p.passes ?? 0, 10) || 0;
      const getJaunes = p => parseInt(p.cartons_jaunes ?? 0, 10) || 0;
      const getBlancs = p => parseInt(p.cartons_blancs ?? 0, 10) || 0;
      const getRouges = p => parseInt(p.cartons_rouges ?? 0, 10) || 0;

      // Correction : on applique le filtre sur 'players'
      const topScorers = players.filter(p => getNbButs(p) > 0).sort((a, b) => getNbButs(b) - getNbButs(a));
      const topPassers = players.filter(p => getNbPasses(p) > 0).sort((a, b) => getNbPasses(b) - getNbPasses(a));
      const topCards = players.filter(p => getJaunes(p) > 0 || getBlancs(p) > 0 || getRouges(p) > 0);
      const topPlayed = players.filter(p => getNbMatchs(p) > 0).sort((a, b) => getNbMatchs(b) - getNbMatchs(a));

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
        <ul class="collapsed">${renderList(topCards, p => `🟨 ${getJaunes(p)} | ⬜ ${getBlancs(p)} | 🟥 ${getRouges(p)}`, "Aucun carton")}</ul>
        
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
      const  = await Promise.all();

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
        html += `<h3 class="accordion-header">⬜🟨🟥 Arbitres</h3><ul class="collapsed">${list}</ul>`;
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
      const annonces = await loadJson('annonces.json');
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
      const  = await Promise.all();

      let goalEvents = ;
      let cardEvents = ;

      let matchOptions = matches.map((m, idx) => 
        `<option value="${idx}">${m.date} - vs ${m.adversaire} (${m.lieu})</option>`
      ).join('');

      let playerOptionsScorer = `<option value="CSC"> But contre son camp</option>` + players.map(p => {
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

      // Pré-remplir le score et les événements si le match sélectionné possède déjà des infos
      const selectMatchEl = document.getElementById('select-match');
      const matchScoreEl = document.getElementById('match-score');

      function loadMatchDataToForm(matchIndex) {
        const m = matches;
        if (!m) return;
        matchScoreEl.value = m.resultat || '';
        
        goalEvents = ;
        if (m.buteurs) {
          const bList = m.buteurs.split(',').map(s => s.trim());
          bList.forEach(b => {
            if (b) goalEvents.push({ buteur: b, passeur: '' });
          });
        }
        renderGoalsUI();
        cardEvents = ;
        renderCardsUI();
      }

      loadMatchDataToForm(selectMatchEl.value);
      selectMatchEl.addEventListener('change', (e) => {
        loadMatchDataToForm(e.target.value);
      });

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

        const jsonString = JSON.stringify(newContent, null, 2);
        const bytes = new TextEncoder().encode(jsonString);
        let binary = '';
        bytes.forEach((b) => binary += String.fromCharCode(b));
        const base64Content = btoa(binary);

        const putRes = await fetch(getUrl, {
          method: 'PUT',
          headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: commitMessage,
            content: base64Content,
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
            if (e.buteur && e.buteur !== 'CSC') butsMap = (butsMap || 0) + 1;
            if (e.passeur) passesMap = (passesMap || 0) + 1;
          });

          cardEvents.forEach(c => {
            if (c.type === '🟨') jaunesMap = (jaunesMap || 0) + 1;
            if (c.type === '⬜') blancsMap = (blancsMap || 0) + 1;
            if (c.type === '🟥') rougesMap = (rougesMap || 0) + 1;
          });

          const updatedPlayers = players.map(p => {
            const fullName = getPlayerFullName(p);
            let updatedP = { ...p };

            // Ne rajoute un match joué que si explicitement coché
            if (presentList.includes(fullName)) {
              updatedP.matchs = (parseInt(updatedP.matchs || updatedP.matches, 10) || 0) + 1;
            }
            if (butsMap) {
              updatedP.buts = (parseInt(updatedP.buts, 10) || 0) + butsMap;
            }
            if (passesMap) {
              updatedP.passes = (parseInt(updatedP.passes, 10) || 0) + passesMap;
            }
            if (jaunesMap) {
              updatedP.cartons_jaunes = (parseInt(updatedP.cartons_jaunes, 10) || 0) + jaunesMap;
            }
            if (blancsMap) {
              updatedP.cartons_blancs = (parseInt(updatedP.cartons_blancs, 10) || 0) + blancsMap;
            }
            if (rougesMap) {
              updatedP.cartons_rouges = (parseInt(updatedP.cartons_rouges, 10) || 0) + rougesMap;
            }

           
