document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  
  // --- GESTION DU MODE SOMBRE ---
  const toggleBtn = document.getElementById('darkModeToggle');
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    if (toggleBtn) toggleBtn.textContent = '☀️';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      toggleBtn.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }
  // -----------------------------
  
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

  async function loadJson(filename, defaultValue = []) {
    try {
      const res = await fetchFresh(filename);
      if (!res.ok) return defaultValue;
      return await res.json();
    } catch (e) {
      return defaultValue;
    }
  }

  function getPlayerFullName(p) {
    if (!p) return '';
    const nom = (p.nom || p.Nom || '').trim().toUpperCase();
    let prenom = (p.prenom || p.Prenom || p.prénom || '').trim();
    if (prenom.length > 0) {
      prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase();
    }
    return prenom ? `${nom} ${prenom}` : nom;
  }

  function removeDuplicates(membersArray) {
    const map = new Map();
    membersArray.forEach(member => {
      const rawName = getPlayerFullName(member);
      if (rawName) {
        const cleanName = rawName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .replace(/\s+/g, ' ')
          .trim();
        
        if (!map.has(cleanName)) {
          map.set(cleanName, member);
        }
      }
    });
    return Array.from(map.values());
  }

  function formatScoreColor(scoreStr) {
    if (!scoreStr) return '';
    const lower = scoreStr.toLowerCase();
    let color = '#333';
    if (lower.includes('victoire')) color = '#28a745';
    else if (lower.includes('défaite')) color = '#dc3545';
    else if (lower.includes('nul')) color = '#ffc107';
    return `<span style="color: ${color}; font-weight: bold;">${scoreStr}</span>`;
  }

  function getPosteColor(poste) {
    if (!poste) return '#6c757d';
    const p = poste.toLowerCase();
    if (p.includes('gardien')) return '#ffc107';
    if (p.includes('défenseur')) return '#007bff';
    if (p.includes('milieu')) return '#28a745';
    if (p.includes('attaquant')) return '#dc3545';
    return '#6c757d';
  }

  function getBirthMonth(bdayRaw) {
    if (!bdayRaw) return null;
    const clean = bdayRaw.trim();
    const parts = clean.includes('/') ? clean.split('/') : clean.split('-');
    if (parts.length < 3) return null;
    return parseInt(parts[1], 10);
  }

  // --- PAGE D'ACCUEIL ---
  async function renderHome() {
    let bdaysHTML = '<div style="padding: 15px; text-align:center; color:#666;">Aucun anniversaire ce mois-ci 🎉</div>';
    let lastMatchHTML = '<div style="padding: 15px; text-align:center; color:#666;">Aucun résultat récent</div>';
    let nextMatchHTML = '<div style="padding: 15px; text-align:center; color:#666;">Aucun match à venir</div>';

    const [players, dirigeants, arbitres] = await Promise.all([
      loadJson('players.json'),
      loadJson('dirigeants.json'),
      loadJson('arbitres.json')
    ]);

    const allMembers = removeDuplicates([...players, ...dirigeants, ...arbitres]);

    if (allMembers.length > 0) {
      const currentMonth = new Date().getMonth() + 1;
      const monthBDays = allMembers.filter(m => {
        const bdayRaw = m.naissance || m.date_de_naissance || m.Naissance || '';
        return getBirthMonth(bdayRaw) === currentMonth;
      });

      if (monthBDays.length > 0) {
        monthBDays.sort((a, b) => {
          const dateA = a.naissance || a.date_de_naissance || a.Naissance || '';
          const dateB = b.naissance || b.date_de_naissance || b.Naissance || '';
          return dateA.localeCompare(dateB);
        });

        bdaysHTML = monthBDays.map(m => {
          const bdayRaw = m.naissance || m.date_de_naissance || m.Naissance || '';
          const parts = bdayRaw.includes('/') ? bdayRaw.split('/') : bdayRaw.split('-');
          let shortDate = bdayRaw;
          if (parts.length >= 3) {
            shortDate = parts[0].length === 4 ? `${parts[2]}/${parts[1]}` : `${parts[0]}/${parts[1]}`;
          }

          return `
            <div style="padding: 10px 12px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span>🎂 <strong>${getPlayerFullName(m)}</strong></span>
              <small style="color: var(--primary-color, #007bff); font-weight: bold;">${shortDate}</small>
            </div>
          `;
        }).join('');
      }
    }

    const matches = await loadJson('matchs.json');
    if (Array.isArray(matches) && matches.length > 0) {
      const playedMatches = matches.filter(m => m.resultat && m.resultat.trim() !== '');
      if (playedMatches.length > 0) {
        const lastPlayed = playedMatches[playedMatches.length - 1];
        let detailsHTML = '';
        if (lastPlayed.buteurs) detailsHTML += `<div style="font-size: 0.9em; color: #444; margin-top: 6px;">⚽ <strong>Buteur(s) :</strong> ${lastPlayed.buteurs}</div>`;
        if (lastPlayed.passeurs) detailsHTML += `<div style="font-size: 0.9em; color: #444; margin-top: 4px;">👟 <strong>Passeur(s) :</strong> ${lastPlayed.passeurs}</div>`;

        lastMatchHTML = `
          <div style="text-align: center;">
            <div style="color: #666; font-size: 0.9em; margin-bottom: 4px;">📅 ${lastPlayed.date || ''} - ${lastPlayed.lieu || ''}</div>
            <div style="font-size: 1.15em; font-weight: bold; margin-bottom: 6px;">vs ${lastPlayed.adversaire || ''}</div>
            <div style="font-size: 1.05em; margin-bottom: 6px;">Score : ${formatScoreColor(lastPlayed.resultat)}</div>
            ${detailsHTML}
          </div>
        `;
      }

      const upcomingMatches = matches.filter(m => !m.resultat || m.resultat.trim() === '');
      if (upcomingMatches.length > 0) {
        const nextMatch = upcomingMatches[0];
        const isDomicile = nextMatch.lieu && nextMatch.lieu.toLowerCase().includes('domicile');
        const badgeColor = isDomicile ? '#28a745' : '#17a2b8';

        nextMatchHTML = `
          <div style="text-align: center;">
            <div style="color: #666; font-size: 0.9em; margin-bottom: 4px;">📅 ${nextMatch.date || ''}</div>
            <div style="font-size: 1.15em; font-weight: bold; margin-bottom: 8px;">vs ${nextMatch.adversaire || ''}</div>
            <span style="background: ${badgeColor}; color: white; padding: 3px 12px; border-radius: 12px; font-size: 0.85em; font-weight: bold;">${nextMatch.lieu || 'N/C'}</span>
          </div>
        `;
      }
    }

    root.innerHTML = `
      <div style="background: #5c1d43; color: white; padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; box-shadow: var(--shadow);">
        <span style="font-weight: bold; font-size: 1.05em;">🛍️ Boutique Officielle JAKO</span>
        <a href="https://team.jako.com/fr-fr/team/fc_is/" target="_blank" style="background: rgba(255,255,255,0.2); color: white; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 0.9em; font-weight: bold;">Visiter ↗</a>
      </div>

      <div style="background: #5c1d43; color: white; padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; box-shadow: var(--shadow);">
        <span style="font-weight: bold; font-size: 1.05em;">📊 Classement Officiel</span>
        <a href="https://epreuves.fff.fr/competition/engagement/449274-departemental-4/phase/1/2/classement" target="_blank" style="background: rgba(255,255,255,0.2); color: white; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 0.9em; font-weight: bold;">Consulter ↗</a>
      </div>

      <div style="background: white; border-radius: 10px; margin-bottom: 20px; box-shadow: var(--shadow); overflow: hidden; border: 1px solid #eaeaea;">
        <div style="background: #5c1d43; color: white; padding: 10px 15px; font-weight: bold; text-align: center; font-size: 1.05em;">
          ⚽ Dernier Match
        </div>
        <div style="padding: 15px;">
          ${lastMatchHTML}
        </div>
      </div>

      <div style="background: white; border-radius: 10px; margin-bottom: 20px; box-shadow: var(--shadow); overflow: hidden; border: 1px solid #eaeaea;">
        <div style="background: #5c1d43; color: white; padding: 10px 15px; font-weight: bold; text-align: center; font-size: 1.05em;">
          🏆 Prochain Match
        </div>
        <div style="padding: 15px;">
          ${nextMatchHTML}
        </div>
      </div>

      <div style="background: white; border-radius: 10px; margin-bottom: 20px; box-shadow: var(--shadow); overflow: hidden; border: 1px solid #eaeaea;">
        <div style="background: #5c1d43; color: white; padding: 10px 15px; font-weight: bold; text-align: center; font-size: 1.05em;">
          🎉 Anniversaires du mois
        </div>
        <div style="padding: 15px;">
          ${bdaysHTML}
        </div>
      </div>
    `;
  }

  // --- PRONOSTICS INTERACTIFS ---
  async function renderPronos() {
    root.innerHTML = `
      <h2>🎯 Le Défi Pronos du F.C. IS</h2>
      
      <!-- Bloc pour faire son prono via Google Form -->
      <div style="background: var(--card-bg); padding: 25px 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: var(--shadow); border: 1px solid var(--border-color); text-align: center;">
        <h3 style="margin-top: 0; background: none; color: var(--primary-color);">Fais ton pronostic !</h3>
        <p style="color: var(--text-muted); font-size: 0.95em; margin-bottom: 20px; line-height: 1.4;">
          Règles : 5 pts pour le score exact, 3 pts pour le bon résultat (1N2) ! Valide ton prono avant le match.
        </p>
        
        <a href="https://forms.gle/KLYdMeGPt1UCHDMG9" target="_blank" style="background: var(--primary-color); color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: var(--shadow); font-size: 1.05em;">
          📝 Remplir le formulaire de pronos ↗
        </a>
      </div>

      <!-- Bloc Classement des pronos -->
      <div style="background: var(--card-bg); padding: 20px; border-radius: 12px; box-shadow: var(--shadow); border: 1px solid var(--border-color);">
        <h3 style="margin-top: 0; background: none; color: var(--primary-color);">🏆 Classement des Pronostiqueurs</h3>
        <p style="text-align: center; color: var(--text-muted); font-size: 0.9em; margin-bottom: 15px;">Le classement de la saison.</p>
        
        <div id="pronos-leaderboard">
          <p style="text-align: center; color: var(--text-muted);">Chargement du classement...</p>
        </div>
      </div>
    `;

    try {
      // Mets ton lien d'export CSV Google Sheets ici (ex: .../export?format=csv)
      const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2rDibne_VPWER2-V9JpIuIEeR_0pNSiZe343ktp_5FEFLQLG5KZeZxv1m2J8KSWvLMCgPf7rM-cVx/pub?gid=1278749089&single=true&output=csv'; 
      const res = await fetchFresh(csvUrl);
      const csvText = await res.text();

      // Sécurité : si le texte commence par "<!", c'est que c'est du HTML et non du CSV
      if (csvText.trim().startsWith('<')) {
        throw new Error("Le lien ne renvoie pas un fichier CSV valide.");
      }

      // Découpage propre du CSV en gérant les sauts de ligne
      const rows = csvText.split(/\r?\n/).map(row => row.split(','));
      let leaderboardHTML = '<ul style="margin-top: 5px; padding-left: 0; list-style: none;">';
      
      let hasData = false;
      // On commence à la ligne 1 pour sauter l'en-tête
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length >= 2 && cols[0].trim() !== '') {
          hasData = true;
          const prenom = cols[0].replace(/"/g, '').trim();
          const points = cols[1].replace(/"/g, '').trim();
          
          let medal = '⚽';
          if (i === 1) medal = '🥇';
          else if (i === 2) medal = '🥈';
          else if (i === 3) medal = '🥉';

          leaderboardHTML += `
            <li style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-color); margin-bottom: 8px; padding: 10px 15px; border-radius: 8px; border-left: 5px solid var(--primary-color);">
              <span>${medal} <strong>${prenom}</strong></span>
              <span style="font-weight: bold; color: var(--primary-color);">${points} pts</span>
            </li>
          `;
        }
      }

      leaderboardHTML += '</ul>';

      if (!hasData) {
        leaderboardHTML = '<p style="text-align: center; color: var(--text-muted);">Aucun point enregistré pour l\'instant.</p>';
      }

      document.getElementById('pronos-leaderboard').innerHTML = leaderboardHTML;

    } catch (e) {
      document.getElementById('pronos-leaderboard').innerHTML = '<p style="text-align: center; color: red;">Erreur de chargement du classement (Vérifie le lien CSV).</p>';
    }
  }
  
  // --- EFFECTIF ---
  async function renderPlayers() {
    root.innerHTML = '<h2>Effectif du Club</h2><p style="text-align: center;">Chargement...</p>';
    try {
      const [players, dirigeants, arbitres] = await Promise.all([
        loadJson('players.json'),
        loadJson('dirigeants.json'),
        loadJson('arbitres.json')
      ]);
      let html = '<h2>Effectif du Club</h2>';

      const cleanPlayers = removeDuplicates(players);
      const cleanDirigeants = removeDuplicates(dirigeants);
      const cleanArbitres = removeDuplicates(arbitres);

      if (cleanPlayers.length > 0) {
        const list = cleanPlayers.map(p => `<li style="border-left: 4px solid ${getPosteColor(p.poste)};">⚽ <strong>${p.numero ? '#' + p.numero + ' ' : ''}${getPlayerFullName(p)}</strong><br><small>${p.poste || ''}</small></li>`).join('');
        html += `<h3 class="accordion-header">⚽ Joueurs</h3><ul class="collapsed">${list}</ul>`;
      }
      
      if (cleanDirigeants.length > 0) {
        const list = cleanDirigeants.map(d => {
          const symbole = d.symbole || '👔';
          return `<li style="border-left: 4px solid #6c757d;">${symbole} <strong>${getPlayerFullName(d)}</strong><br><small>${d.fonction || ''}</small></li>`;
        }).join('');
        
        html += `<h3 class="accordion-header">👔 Dirigeants</h3><ul class="collapsed">${list}</ul>`;
      }

      if (cleanArbitres.length > 0) {
        const list = cleanArbitres.map(a => {
          const type = (a.categorie || a.fonction || '').toLowerCase();
          const isBenevole = type.includes('bénévole') || type.includes('benevole') || type.includes('touche');
          const icone = isBenevole ? '🏁' : '🟨 🟥';

          return `<li style="border-left: 4px solid #6c757d;">
            ${icone} <strong>${getPlayerFullName(a)}</strong><br>
            <small>${a.categorie || 'Club'}</small>
          </li>`;
        }).join('');
        
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
      root.innerHTML = '<h2>Effectif du Club</h2><p style="color: red; text-align: center;">Erreur de chargement.</p>';
    }
  }

  // --- CALENDRIER ---
  async function renderMatches() {
    root.innerHTML = '<h2>Calendrier & Résultats</h2><p style="text-align: center;">Chargement...</p>';
    try {
      const matches = await loadJson('matchs.json');
      if (!Array.isArray(matches)) throw new Error("Format invalide");

      const matchesHTML = matches.map(m => {
        const isDomicile = m.lieu && typeof m.lieu === 'string' && m.lieu.toLowerCase().includes('domicile');
        const badgeColor = isDomicile ? '#28a745' : '#17a2b8';
        
        let detailsHTML = '';
        if (m.buteurs) detailsHTML += '<div style="font-size: 0.85em; color: #555; margin-top: 4px;">⚽ <strong>Buteurs :</strong> ' + m.buteurs + '</div>';
        if (m.passeurs) detailsHTML += '<div style="font-size: 0.85em; color: #555; margin-top: 2px;">👟 <strong>Passeurs :</strong> ' + m.passeurs + '</div>';

        const scoreDisplay = m.resultat ? formatScoreColor(m.resultat) : '<em>À venir</em>';

        return `
          <li style="border-left: 4px solid ${badgeColor}; padding: 12px; margin-bottom: 10px; background: white; border-radius: 8px; list-style: none; box-shadow: var(--shadow);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <small style="color: #666; font-weight: bold;">Date : ${m.date || 'Inconnue'}</small>
              <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">${m.lieu || 'N/C'}</span>
            </div>
            <div style="font-size: 1.1em; margin-bottom: 5px;"><strong>vs ${m.adversaire || 'Inconnu'}</strong></div>
            <div>Score : ${scoreDisplay}</div>
            ${detailsHTML}
          </li>
        `;
      }).join('');

      root.innerHTML = '<h2>Calendrier & Résultats</h2><ul style="padding: 0;">' + matchesHTML + '</ul>';
    } catch (e) {
      root.innerHTML = '<h2>Calendrier & Résultats</h2><p style="color: red; text-align: center;">Erreur de chargement des matchs.</p>';
    }
  }

  // --- STATISTIQUES ---
  async function renderStats() {
    root.innerHTML = '<h2>Statistiques</h2><p style="text-align: center;">Chargement...</p>';
    try {
      const [players, matches] = await Promise.all([
        loadJson('players.json'),
        loadJson('matchs.json')
      ]);

      const dynamicGoals = {};
      let totalMatchsJoues = 0;
      let nbVictoires = 0;
      let nbNuls = 0;
      let nbDefaites = 0;

      if (Array.isArray(matches)) {
        matches.forEach(m => {
          if (m.resultat && m.resultat.trim() !== '') {
            totalMatchsJoues++;
            const lowerRes = m.resultat.toLowerCase();
            if (lowerRes.includes('victoire')) nbVictoires++;
            else if (lowerRes.includes('nul')) nbNuls++;
            else if (lowerRes.includes('défaite') || lowerRes.includes('defaite')) nbDefaites++;
          }

          if (m.buteurs) {
            const lines = m.buteurs.split(/,|\n/);
            lines.forEach(line => {
              let cleanName = line.replace(/\d+['e]*/g, '').replace(/⚽/g, '').trim().toUpperCase();
              if (cleanName) {
                dynamicGoals[cleanName] = (dynamicGoals[cleanName] || 0) + 1;
              }
            });
          }
        });
      }

      const getNbMatchs = p => parseInt(p.matchs ?? p.matches ?? 0, 10) || 0;
      const getNbButs = p => {
        const baseButs = parseInt(p.buts ?? 0, 10) || 0;
        const fullName = getPlayerFullName(p).toUpperCase();
        return baseButs + (dynamicGoals[fullName] || 0);
      };
      const getNbPasses = p => parseInt(p.passes ?? 0, 10) || 0;
      const getJaunes = p => parseInt(p.cartons_jaunes ?? 0, 10) || 0;
      const getBlancs = p => parseInt(p.cartons_blancs ?? 0, 10) || 0;
      const getRouges = p => parseInt(p.cartons_rouges ?? 0, 10) || 0;

      const topScorers = players.filter(p => getNbButs(p) > 0).sort((a, b) => getNbButs(b) - getNbButs(a));
      const topPassers = players.filter(p => getNbPasses(p) > 0).sort((a, b) => getNbPasses(b) - getNbPasses(a));
      const topCards = players.filter(p => getJaunes(p) > 0 || getBlancs(p) > 0 || getRouges(p) > 0);
      const topPlayed = players.filter(p => getNbMatchs(p) > 0).sort((a, b) => getNbMatchs(b) - getNbMatchs(a));

      const renderList = (arr, labelFn, emptyMsg) => arr.length > 0 ? arr.map(p => `
        <li><strong>${getPlayerFullName(p)}</strong><br><small>${labelFn(p)}</small></li>
      `).join('') : `<p style="padding: 10px; color: var(--text-muted); text-align: center;">${emptyMsg}</p>`;

      root.innerHTML = `
        <h2>Statistiques de la Saison</h2>

        <div style="background: var(--card-bg); border-radius: 12px; margin-bottom: 20px; box-shadow: var(--shadow); overflow: hidden; border: 1px solid var(--border-color); text-align: center;">
          <div style="background: #5c1d43; color: white; padding: 10px 15px; font-weight: bold; font-size: 1.05em;">
            📊 Bilan Global (${totalMatchsJoues} match${totalMatchsJoues > 1 ? 's' : ''} joué${totalMatchsJoues > 1 ? 's' : ''})
          </div>
          <div style="display: flex; justify-content: space-around; padding: 15px 10px;">
            <div>
              <div style="font-size: 1.6em; font-weight: bold; color: #28a745;">${nbVictoires}</div>
              <div style="font-size: 0.9em; color: var(--text-muted); margin-top: 2px;">Victoires</div>
            </div>
            <div>
              <div style="font-size: 1.6em; font-weight: bold; color: #ffc107;">${nbNuls}</div>
              <div style="font-size: 0.9em; color: var(--text-muted); margin-top: 2px;">Nuls</div>
            </div>
            <div>
              <div style="font-size: 1.6em; font-weight: bold; color: #dc3545;">${nbDefaites}</div>
              <div style="font-size: 0.9em; color: var(--text-muted); margin-top: 2px;">Défaites</div>
            </div>
          </div>
        </div>

        <h3 class="accordion-header">⚽ Meilleurs Buteurs</h3>
        <ul class="collapsed">${renderList(topScorers, p => `⚽ ${getNbButs(p)} but(s)`, "Aucun buteur")}</ul>
        
        <h3 class="accordion-header">👟 Meilleurs Passeurs</h3>
        <ul class="collapsed">${renderList(topPassers, p => `👟 ${getNbPasses(p)} passe(s)`, "Aucune passe décisive")}</ul>
        
        <h3 class="accordion-header">⬜🟨🟥 Discipline</h3>
        <ul class="collapsed">${renderList(topCards, p => `🟨 ${getJaunes(p)} | ⬜ ${getBlancs(p)} \vert{} 🟥 ${getRouges(p)}`, "Aucun carton")}</ul>
        
        <h3 class="accordion-header">⭐ Matchs Joués par les Joueurs</h3>
        <ul class="collapsed">${renderList(topPlayed, p => `⭐ ${getNbMatchs(p)} match(s)`, "Aucun match enregistré")}</ul>
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
      root.innerHTML = '<h2>Statistiques</h2><p style="color: red; text-align: center;">Erreur de chargement.</p>';
    }
  }

  // --- ANNONCES ---
  async function renderAnnouncements() {
    root.innerHTML = '<h2>Annonces Club</h2><p style="text-align: center;">Chargement...</p>';
    try {
      const annonces = await loadJson('annonces.json');
      const list = Array.isArray(annonces) ? annonces.map(a => `
        <li style="border-left-color: ${a.couleur_bordure || 'var(--primary-color)'};">
          📢 <strong>${a.titre || ''}</strong><br>${a.details || ''}
        </li>
      `).join('') : '';
      root.innerHTML = `<h2>Annonces Club</h2><ul>${list}</ul>`;
    } catch (e) {
      root.innerHTML = '<h2>Annonces Club</h2><p style="color: red; text-align: center;">Erreur de chargement.</p>';
    }
  }

  function router() {
    const hash = window.location.hash.substring(1) || 'home';
    if (hash === 'home') renderHome();
    else if (hash === 'matches') renderMatches();
    else if (hash === 'stats') renderStats();
    else if (hash === 'players') renderPlayers();
    else if (hash === 'pronos') renderPronos();
    else if (hash === 'announcements') renderAnnouncements();
    else if (hash === 'admin') renderAdmin();
    else renderHome();
  }

  window.addEventListener('hashchange', router);
  router();
});
