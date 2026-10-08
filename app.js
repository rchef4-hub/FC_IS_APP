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
      const playedMatches = matches.filter(m => (m.resultat || m.Resultat) && (m.resultat || m.Resultat).trim() !== '');
      if (playedMatches.length > 0) {
        const lastPlayed = playedMatches[playedMatches.length - 1];
        
        const buteursVal = lastPlayed.buteurs || lastPlayed.Buteurs || '';
        const passeursVal = lastPlayed.passeurs || lastPlayed.Passeurs || '';
        const resultatVal = lastPlayed.resultat || lastPlayed.Resultat || '';
        const dateVal = lastPlayed.date || lastPlayed.Date || '';
        const lieuVal = lastPlayed.lieu || lastPlayed.Lieu || '';
        const adversaireVal = lastPlayed.adversaire || lastPlayed.Adversaire || '';

        let detailsHTML = '';
        if (buteursVal.trim() !== '') detailsHTML += `<div style="font-size: 0.9em; color: #444; margin-top: 6px;">⚽ <strong>Buteur(s) :</strong> ${buteursVal}</div>`;
        if (passeursVal.trim() !== '') detailsHTML += `<div style="font-size: 0.9em; color: #444; margin-top: 4px;">👟 <strong>Passeur(s) :</strong> ${passeursVal}</div>`;

        lastMatchHTML = `
          <div style="text-align: center;">
            <div style="color: #666; font-size: 0.9em; margin-bottom: 4px;">📅 ${dateVal} - ${lieuVal}</div>
            <div style="font-size: 1.15em; font-weight: bold; margin-bottom: 6px;">vs ${adversaireVal}</div>
            <div style="font-size: 1.05em; margin-bottom: 6px;">Score : ${formatScoreColor(resultatVal)}</div>
            ${detailsHTML}
          </div>
        `;
      }

      const upcomingMatches = matches.filter(m => !((m.resultat || m.Resultat) && (m.resultat || m.Resultat).trim() !== ''));
      if (upcomingMatches.length > 0) {
        const nextMatch = upcomingMatches[0];
        const lieuNext = nextMatch.lieu || nextMatch.Lieu || '';
        const isDomicile = lieuNext.toLowerCase().includes('domicile');
        const badgeColor = isDomicile ? '#28a745' : '#17a2b8';
        const dateNext = nextMatch.date || nextMatch.Date || '';
        const advNext = nextMatch.adversaire || nextMatch.Adversaire || '';

        nextMatchHTML = `
          <div style="text-align: center;">
            <div style="color: #666; font-size: 0.9em; margin-bottom: 4px;">📅 ${dateNext}</div>
            <div style="font-size: 1.15em; font-weight: bold; margin-bottom: 8px;">vs ${advNext}</div>
            <span style="background: ${badgeColor}; color: white; padding: 3px 12px; border-radius: 12px; font-size: 0.85em; font-weight: bold;">${lieuNext || 'N/C'}</span>
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

// --- PRONOSTICS INTERACTIFS (Via JSONP & Chargement des matchs) ---
  async function renderPronos() {
    // 1. Structure de base avec un style CSS pour tuer net ces triangles
    root.innerHTML = `
      <style>
        /* Correctif pour masquer définitivement les petits triangles de repli */
        h3 span[style*="display: none"], h3::after, h3::before, .card h3::after {
          display: none !important;
        }
      </style>

      <h2>🎯 Le Défi Pronos du F.C. IS</h2>
      
      <div style="background: var(--card-bg); padding: 25px 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: var(--shadow); border: 1px solid var(--border-color); text-align: center;">
        <h3 style="margin-top: 0; background: none; color: var(--primary-color);">Fais ton pronostic !</h3>
        <p style="color: var(--text-muted); font-size: 0.95em; margin-bottom: 15px; line-height: 1.4;">
          Règles : 5 pts pour le score exact, 3 pts pour le bon résultat (1N2).
        </p>
        
         <p style="color: var(--primary-color); font-size: 0.9em; font-weight: bold; margin-bottom: 15px;">
          Valide ton prono avant le match.
        </p>
        
        <div id="prochain-match-container" style="background: var(--bg-color); padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
          <span style="font-size: 0.9em; color: var(--text-muted);">Chargement du match...</span>
        </div>
        
        <a href="https://forms.gle/KLYdMeGPt1UCHDMG9" target="_blank" style="background: var(--primary-color); color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: var(--shadow); font-size: 1.05em;">
          📝 Remplir le formulaire de pronos ↗
        </a>
      </div>

      <div style="background: var(--card-bg); padding: 20px; border-radius: 12px; box-shadow: var(--shadow); border: 1px solid var(--border-color); text-align: center;">
        <h3 style="margin-top: 0; background: none; color: var(--primary-color);">🏆 Classement des Pronostiqueurs</h3>
        <p style="text-align: center; color: var(--text-muted); font-size: 0.9em; margin-bottom: 15px;">Le classement de la saison.</p>
        
        <div id="pronos-leaderboard" style="text-align: left;">
          <p style="text-align: center; color: var(--text-muted);">Chargement du classement...</p>
        </div>
      </div>
    `;

    // 2. Chargement du fichier matchs.json (uniquement les noms des clubs, centré)
    try {
      const response = await fetch('matchs.json');
      const matchs = await response.json();
      
      const prochainMatch = matchs.find(m => !m.resultat || m.resultat.trim() === "");
      
      const matchContainer = document.getElementById('prochain-match-container');
      if (matchContainer) {
        if (prochainMatch) {
          matchContainer.innerHTML = `
            <strong style="color: var(--primary-color); font-size: 1.15em; display: block;">F.C. IS vs ${prochainMatch.adversaire}</strong>
          `;
        } else {
          matchContainer.innerHTML = `<span style="font-size: 0.9em; color: var(--text-muted);">Aucun match à venir pour le moment.</span>`;
        }
      }
    } catch (e) {
      console.log("Erreur chargement matchs.json", e);
      const matchContainer = document.getElementById('prochain-match-container');
      if (matchContainer) {
        matchContainer.innerHTML = `<span style="font-size: 0.9em; color: var(--text-muted);">Match à venir</span>`;
      }
    }

    // 3. Chargement du classement via JSONP
    try {
      window.handlePronosResponse = function(pronos) {
        let leaderboardHTML = '<ul style="margin-top: 5px; padding-left: 0; list-style: none;">';
        
        if (Array.isArray(pronos) && pronos.length > 0) {
          pronos.sort((a, b) => b.points - a.points);

          pronos.forEach((p, index) => {
            const rang = index + 1;
            let medal = '⚽';
            if (rang === 1) medal = '🥇';
            else if (rang === 2) medal = '🥈';
            else if (rang === 3) medal = '🥉';

            leaderboardHTML += `
              <li style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-color); margin-bottom: 8px; padding: 10px 15px; border-radius: 8px; border-left: 5px solid var(--primary-color);">
                <span>${medal} <strong>${p.prenom}</strong></span>
                <span style="font-weight: bold; color: var(--primary-color);">${p.points} pts</span>
              </li>
            `;
          });
        } else {
          leaderboardHTML += '<p style="text-align: center; color: var(--text-muted);">Aucun point enregistré pour l\'instant.</p>';
        }

        leaderboardHTML += '</ul>';
        const container = document.getElementById('pronos-leaderboard');
        if (container) container.innerHTML = leaderboardHTML;
      };

      const script = document.createElement('script');
      script.src = 'https://script.google.com/macros/s/AKfycbyqHf9kUgyf9GFaIixO5HEN4DkWaI_d2y4dIuVLR6kbRt9zpNcWq-XlxVeLFnsqFIoe_Q/exec?callback=handlePronosResponse';
      script.onerror = function() {
        document.getElementById('pronos-leaderboard').innerHTML = '<p style="text-align: center; color: red;">Erreur de chargement du classement.</p>';
      };
      document.body.appendChild(script);

    } catch (e) {
      document.getElementById('pronos-leaderboard').innerHTML = '<p style="text-align: center; color: red;">Erreur de chargement du classement.</p>';
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

  // --- ADMINISTRATION (SAISIE & RESET) ---
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

      let playerOptionsScorer = `<option value="CSC">[CSC] But contre son camp</option>` + players.map(p => 
        `<option value="${p.nom}">${p.nom}</option>`
      ).join('');

      let playerOptionsPasser = players.map(p => 
        `<option value="${p.nom}">${p.nom}</option>`
      ).join('');

      let playerCheckboxList = players.map(p => `
        <label style="display:block; margin: 5px 0; font-size: 0.95em;">
          <input type="checkbox" class="presence-check" value="${p.nom}">
          #${p.numero || ''} ${p.nom} (${p.poste || ''})
        </label>
      `).join('');

      root.innerHTML = `
        <h2>⚙️ Saisie d'un Match</h2>
        <div style="background: white; padding: 15px; border-radius: 12px; box-shadow: var(--shadow);">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">1. Sélectionner le match :</label>
          <select id="select-match" style="width: 100%; padding: 8px; margin-bottom: 15px; border-radius: 6px;">
            ${matchOptions}
          </select>

          <label style="font-weight: bold; display: block; margin-bottom: 5px;">2. Score final :</label>
          <input type="text" id="match-score" placeholder="Ex: Victoire 3 - 0 ou Défaite 1 -2" style="width: 100%; padding: 8px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #ccc;">

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
            <button id="btn-add-goal" type="button" style="background: var(--primary-color); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">+ Ajouter</button>
          </div>

          <label style="font-weight: bold; display: block; margin-bottom: 5px;">5. Ajouter un Avertissement / Carton :</label>
          <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            <select id="select-joueur-carton" style="flex: 1; padding: 6px; border-radius: 6px;">
              <option value="">-- Joueur Sanctionné --</option>
              ${playerOptionsPasser}
            </select>
            <select id="select-type-carton" style="width: 140px; padding: 6px; border-radius: 6px;">
              <option value="🟨">🟨 Jaune</option>
              <option value="⬜">⬜ Blanc (Excl. temp.)</option>
              <option value="🟥">🟥 Rouge Direct</option>
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
        const goalsContainer = document.getElementById('goals-list');
        if (goalEvents.length === 0) {
          goalsContainer.innerHTML = `<small style="color: #888;">Aucun but ajouté pour l'instant.</small>`;
          return;
        }
        goalsContainer.innerHTML = goalEvents.map((e, index) => {
          const buteurLabel = e.buteur === 'CSC' ? '🤖 <em>[CSC] But contre son camp</em>' : `⚽ <strong>${e.buteur}</strong>`;
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 8px 12px; border-radius: 8px; margin-bottom: 5px; border-left: 4px solid var(--accent-color);">
              <span>${buteurLabel} ${e.passeur ? '<small style="color:#555;">(passe : ' + e.passeur + ')</small>' : ''}</span>
              <button type="button" onclick="removeGoal(${index})" style="background:none; border:none; color:red; cursor:pointer; font-weight:bold;">❌</button>
            </div>
          `;
        }).join('');
      }

      function renderCardsUI() {
        const cardsContainer = document.getElementById('cards-list');
        if (cardEvents.length === 0) {
          cardsContainer.innerHTML = `<small style="color: #888;">Aucun carton ajouté pour l'instant.</small>`;
          return;
        }
        cardsContainer.innerHTML = cardEvents.map((c, index) => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 8px 12px; border-radius: 8px; margin-bottom: 5px; border-left: 4px solid #ffc107;">
            <span>${c.type} <strong>${c.joueur}</strong></span>
            <button type="button" onclick="removeCard(${index})" style="background:none; border:none; color:red; cursor:pointer; font-weight:bold;">❌</button>
          </div>
        `).join('');
      }

      window.removeGoal = function(index) {
        goalEvents.splice(index, 1);
        renderGoalsUI();
      };

      window.removeCard = function(index) {
        cardEvents.splice(index, 1);
        renderCardsUI();
      };

      document.getElementById('btn-add-goal').addEventListener('click', () => {
        const buteur = document.getElementById('select-buteur').value;
        const passeur = document.getElementById('select-passeur').value;
        if (!buteur) {
          alert("Veuillez sélectionner un buteur.");
          return;
        }
        goalEvents.push({ buteur, passeur });
        renderGoalsUI();
        document.getElementById('select-buteur').value = '';
        document.getElementById('select-passeur').value = '';
      });

      document.getElementById('btn-add-card').addEventListener('click', () => {
        const joueur = document.getElementById('select-joueur-carton').value;
        const type = document.getElementById('select-type-carton').value;
        if (!joueur) {
          alert("Veuillez sélectionner un joueur.");
          return;
        }
        cardEvents.push({ joueur, type });
        renderCardsUI();
        document.getElementById('select-joueur-carton').value = '';
      });

      // Gestion de la publication GitHub
      document.getElementById('btn-save-direct').addEventListener('click', async () => {
        const matchIdx = document.getElementById('select-match').value;
        const score = document.getElementById('match-score').value.trim();
        const statusMsg = document.getElementById('status-message');

        if (!score) {
          alert("Veuillez indiquer le score final.");
          return;
        }

        statusMsg.style.color = 'blue';
        statusMsg.textContent = "Publication en cours sur GitHub...";

        try {
          // 1. Récupération des présences cochées
          const checkboxes = document.querySelectorAll('.presence-check:checked');
          const presentNames = Array.from(checkboxes).map(cb => cb.value);

          // 2. Mise à jour des stats des joueurs
          players.forEach(p => {
            if (presentNames.includes(p.nom)) {
              p.matchs = (parseInt(p.matchs || p.matches || 0, 10)) + 1;
            }
          });

          goalEvents.forEach(e => {
            if (e.buteur !== 'CSC') {
              const p = players.find(pl => pl.nom === e.buteur);
              if (p) p.buts = (parseInt(p.buts || 0, 10)) + 1;
            }
            if (e.passeur) {
              const p = players.find(pl => pl.nom === e.passeur);
              if (p) p.passes = (parseInt(p.passes || 0, 10)) + 1;
            }
          });

          cardEvents.forEach(c => {
            const p = players.find(pl => pl.nom === c.joueur);
            if (p) {
              if (c.type === '🟨') p.cartons_jaunes = (parseInt(p.cartons_jaunes || 0, 10)) + 1;
              if (c.type === '⬜') p.cartons_blancs = (parseInt(p.cartons_blancs || 0, 10)) + 1;
              if (c.type === '🟥') p.cartons_rouges = (parseInt(p.cartons_rouges || 0, 10)) + 1;
            }
          });

          // 3. Mise à jour du match sélectionné
          const matchTarget = matches[matchIdx];
          matchTarget.resultat = score;
          matchTarget.buteurs = goalEvents.filter(e => e.buteur !== 'CSC').map(e => e.buteur).join(', ');
          matchTarget.passeurs = goalEvents.filter(e => e.passeur).map(e => e.passeur).join(', ');

          // Helper pour envoyer les fichiers sur l'API GitHub
          async function updateGitHubFile(path, contentObj) {
            const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
            const getRes = await fetch(url, {
              headers: { 'Authorization': `token ${githubToken}` }
            });
            const getData = await getRes.json();
            const sha = getData.sha;

            const putRes = await fetch(url, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: `Mise à jour automatique via Admin (${path})`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(contentObj, null, 2)))),
                sha: sha
              })
            });

            if (!putRes.ok) throw new Error(`Erreur GitHub sur ${path}`);
          }

          await updateGitHubFile('players.json', players);
          await updateGitHubFile('matchs.json', matches);

          statusMsg.style.color = 'green';
          statusMsg.textContent = "✅ Match publié et statistiques mises à jour avec succès !";
          setTimeout(() => { window.location.hash = "home"; }, 2000);

        } catch (err) {
          console.error(err);
          statusMsg.style.color = 'red';
          statusMsg.textContent = "❌ Erreur lors de la publication. Vérifiez votre token GitHub.";
        }
      });

      // Gestion de la remise à zéro
      document.getElementById('btn-reset-all').addEventListener('click', async () => {
        if (!confirm("⚠️ ATTENTION : Voulez-vous vraiment réinitialiser toutes les statistiques et les résultats des matchs à zéro ?")) {
          return;
        }

        const statusMsg = document.getElementById('status-message');
        statusMsg.style.color = 'blue';
        statusMsg.textContent = "Réinitialisation en cours...";

        try {
          players.forEach(p => {
            p.matchs = 0;
            p.matches = 0;
            p.buts = 0;
            p.passes = 0;
            p.cartons_jaunes = 0;
            p.cartons_blancs = 0;
            p.cartons_rouges = 0;
          });

          matches.forEach(m => {
            m.resultat = "";
            m.buteurs = "";
            m.passeurs = "";
          });

          async function updateGitHubFile(path, contentObj) {
            const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
            const getRes = await fetch(url, {
              headers: { 'Authorization': `token ${githubToken}` }
            });
            const getData = await getRes.json();
            const sha = getData.sha;

            const putRes = await fetch(url, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: `Remise à zéro globale (${path})`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(contentObj, null, 2)))),
                sha: sha
              })
            });

            if (!putRes.ok) throw new Error(`Erreur GitHub sur ${path}`);
          }

          await updateGitHubFile('players.json', players);
          await updateGitHubFile('matchs.json', matches);

          statusMsg.style.color = 'green';
          statusMsg.textContent = "🔄 Remise à zéro effectuée avec succès !";
          setTimeout(() => { window.location.hash = "home"; }, 2000);

        } catch (err) {
          console.error(err);
          statusMsg.style.color = 'red';
          statusMsg.textContent = "❌ Erreur lors de la remise à zéro.";
        }
      });

      renderGoalsUI();
      renderCardsUI();

    } catch (e) {
      console.error(e);
      root.innerHTML = `<h2>⚙️ Saisie de Match</h2><p style="color: red; text-align: center;">Erreur lors du chargement des données d'administration.</p>`;
    }
  }

  // --- ROUTEUR & INITIALISATION GLOBALE ---
  function router() {
    const hash = window.location.hash.replace('#', '') || 'home';
    if (hash === 'home') renderHome();
    else if (hash === 'pronos') renderPronos();
    else if (hash === 'players') renderPlayers();
    else if (hash === 'matches') renderMatches();
    else if (hash === 'stats') renderStats();
    else if (hash === 'announcements') renderAnnouncements();
    else if (hash === 'admin') renderAdmin();
    else renderHome();
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);
});
