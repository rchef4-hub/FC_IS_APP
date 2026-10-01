document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  
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

  // --- EXTRACTION FIABLE DU MOIS D'ANNIVERSAIRE ---
  function getBirthMonth(bdayRaw) {
    if (!bdayRaw) return null;
    const clean = bdayRaw.trim();
    const parts = clean.includes('/') ? clean.split('/') : clean.split('-');
    if (parts.length < 3) return null;

    // Si le format commence par l'année (ex: YYYY-MM-DD)
    if (parts[0].length === 4) {
      return parseInt(parts[1], 10);
    } 
    // Si le format commence par le jour (ex: DD/MM/YYYY)
    else {
      return parseInt(parts[1], 10);
    }
  }

  // --- PAGE D'ACCUEIL ---
  async function renderHome() {
    let bdaysHTML = '<p style="text-align:center; color:#666;">Aucun anniversaire ce mois-ci 🎉</p>';
    let lastMatchHTML = '<p style="text-align:center; color:#666;">Aucun résultat récent</p>';
    let nextMatchHTML = '<p style="text-align:center; color:#666;">Aucun match à venir</p>';

    const [players, dirigeants, arbitres] = await Promise.all([
      loadJson('players.json'),
      loadJson('dirigeants.json'),
      loadJson('arbitres.json')
    ]);

    const allMembers = removeDuplicates([...players, ...dirigeants, ...arbitres]);

    if (allMembers.length > 0) {
      const currentMonth = new Date().getMonth() + 1; // Septembre = 9
      const monthBDays = allMembers.filter(m => {
        const bdayRaw = m.naissance || m.date_de_naissance || m.Naissance || '';
        return getBirthMonth(bdayRaw) === currentMonth;
      });

      if (monthBDays.length > 0) {
        // Tri optionnel par jour du mois pour plus de lisibilité
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
            <li style="padding: 10px 12px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; list-style: none; border-left: 4px solid var(--accent-color, #ffc107);">
              <span>🎂 <strong>${getPlayerFullName(m)}</strong></span>
              <small style="color: var(--primary-color, #007bff); font-weight: bold;">${shortDate}</small>
            </li>
          `;
        }).join('');
        bdaysHTML = `<ul style="padding: 0; margin: 0;">${bdaysHTML}</ul>`;
      }
    }

    const matches = await loadJson('matchs.json');
    if (Array.isArray(matches) && matches.length > 0) {
      const playedMatches = matches.filter(m => m.resultat && m.resultat.trim() !== '');
      if (playedMatches.length > 0) {
        const lastPlayed = playedMatches[playedMatches.length - 1];
        let detailsHTML = lastPlayed.buteurs ? `<div style="font-size: 0.85em; color: #555; margin-top: 6px;">⚽ <strong>Buteurs :</strong> ${lastPlayed.buteurs}</div>` : '';
        lastMatchHTML = `
          <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; text-align: center;">
            <small style="color: #666;">Dernier match : ${lastPlayed.date || ''} - ${lastPlayed.lieu || ''}</small><br>
            <strong style="font-size: 1.05em;">vs ${lastPlayed.adversaire || ''}</strong><br>
            <div style="margin-top: 4px;">Score : ${formatScoreColor(lastPlayed.resultat)}</div>
            ${detailsHTML}
          </div>
        `;
      }

      const upcomingMatches = matches.filter(m => !m.resultat || m.resultat.trim() === '');
      if (upcomingMatches.length > 0) {
        const nextMatch = upcomingMatches[0];
        nextMatchHTML = `
          <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; text-align: center;">
            <small style="color: #666;">Prochain match : ${nextMatch.date || ''} - ${nextMatch.lieu || ''}</small><br>
            <strong style="font-size: 1.05em;">vs ${nextMatch.adversaire || ''}</strong>
          </div>
        `;
      }
    }

    root.innerHTML = `
      <h2>Accueil</h2>
      <div style="margin-bottom: 20px; text-align: center;">
        <a href="https://example.com/boutique" target="_blank" style="display: block; background: linear-gradient(135deg, var(--primary-color, #007bff), var(--accent-color, #ffc107)); color: white; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 1.1em; box-shadow: var(--shadow);">
          🛍️ Visiter la Boutique du Club
        </a>
      </div>
      <h3>📅 Dernier Match</h3>
      ${lastMatchHTML}
      <h3>🏆 Prochain Match</h3>
      ${nextMatchHTML}
      <h3>🎂 Anniversaires du mois</h3>
      ${bdaysHTML}
    `;
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
        const list = cleanDirigeants.map(d => `<li style="border-left: 4px solid #6c757d;">👔 <strong>${getPlayerFullName(d)}</strong><br><small>${d.fonction || ''}</small></li>`).join('');
        html += `<h3 class="accordion-header">👔 Dirigeants</h3><ul class="collapsed">${list}</ul>`;
      }
      if (cleanArbitres.length > 0) {
        const list = cleanArbitres.map(a => `<li style="border-left: 4px solid #6c757d;">🟨 <strong>${getPlayerFullName(a)}</strong><br><small>Arbitre ${a.categorie || 'Club'}</small></li>`).join('');
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
      const players = await loadJson('players.json');
      const getNbMatchs = p => parseInt(p.matchs ?? p.matches ?? 0, 10) || 0;
      const getNbButs = p => parseInt(p.buts ?? 0, 10) || 0;
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
      `).join('') : `<p style="padding: 10px; color: #666; text-align: center;">${emptyMsg}</p>`;

      root.innerHTML = `
        <h2>Statistiques de la Saison</h2>
        <h3 class="accordion-header">⚽ Meilleurs Buteurs</h3>
        <ul class="collapsed">${renderList(topScorers, p => `⚽ ${getNbButs(p)} but(s)`, "Aucun buteur")}</ul>
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
    else if (hash === 'announcements') renderAnnouncements();
    else if (hash === 'admin') renderAdmin();
    else renderHome();
  }

  window.addEventListener('hashchange', router);
  router();
});
