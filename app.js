document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  const navBtns = document.querySelectorAll('nav button');

  // Utilitaire pour éviter la mise en cache lors des appels fetch
  async function fetchFresh(url) {
    return fetch(`${url}?_=${new Date().getTime()}`);
  }

  // Permet de récupérer le nom complet selon les différentes structures de clés JSON
  function getPlayerFullName(p) {
    if (p.nom) return p.nom;
    if (p.name) return p.name;
    const prenom = p.prenom || p.firstName || '';
    const nom = p.lastName || '';
    return `${prenom} ${nom}`.trim() || 'Joueur Inconnu';
  }

  // --- COMPOSITION / EFFECTIF ---
  async function renderComposition() {
    root.innerHTML = `<h2>Effectif du Club</h2><p style="text-align: center;">Chargement des joueurs...</p>`;
    try {
      const res = await fetchFresh('players.json');
      const players = await res.json();

      const categories = {
        "Gardiens": [],
        "Défenseurs": [],
        "Milieux": [],
        "Attaquants": []
      };

      players.forEach(p => {
        const poste = (p.poste || p.role || '').toLowerCase();
        if (poste.includes('gardien')) categories["Gardiens"].push(p);
        else if (poste.includes('défenseur') || poste.includes('defenseur')) categories["Défenseurs"].push(p);
        else if (poste.includes('milieu')) categories["Milieux"].push(p);
        else if (poste.includes('attaquant')) categories["Attaquants"].push(p);
        else categories["Milieux"].push(p); // Catégorie par défaut si non renseigné
      });

      let html = `<h2>Effectif du Club</h2>`;
      
      for (const [catName, catPlayers] of Object.entries(categories)) {
        if (catPlayers.length > 0) {
          html += `<h3 class="accordion-header">${catName} (${catPlayers.length})</h3>`;
          html += `<ul class="collapsed">`;
          catPlayers.forEach(p => {
            const symbole = p.symbole || '⚽';
            const naissance = p.naissance ? ` (${p.naissance})` : '';
            html += `<li><strong>${symbole} ${getPlayerFullName(p)}</strong>${naissance}</li>`;
          });
          html += `</ul>`;
        }
      }

      root.innerHTML = html;

      // Gestion de l'accordéon
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
      root.innerHTML = `<h2>Effectif du Club</h2><p style="color: red; text-align: center;">Erreur lors du chargement des joueurs.</p>`;
    }
  }

  // --- MATCHS ---
  async function renderMatchs() {
    root.innerHTML = `<h2>Matchs</h2><p style="text-align: center;">Chargement des matchs...</p>`;
    try {
      const res = await fetchFresh('matchs.json');
      const matchs = await res.json();

      let html = `<h2>Saison en cours</h2><div class="matchs-list">`;

      matchs.forEach(m => {
        const isPlayed = m.resultat && m.resultat.trim() !== '';
        const statusClass = isPlayed ? 'played' : 'upcoming';
        const statusText = isPlayed ? m.resultat : 'À venir';

        html += `
          <div class="match-card ${statusClass}">
            <div class="match-header">
              <span class="match-date">📅 ${m.date || 'Date non précisée'}</span>
              <span class="match-status">${statusText}</span>
            </div>
            <div class="match-teams">
              <strong>${m.domicile || 'Équipe 1'}</strong> vs <strong>${m.exterieur || 'Équipe 2'}</strong>
            </div>
        `;

        if (isPlayed) {
          if (m.buteurs) html += `<div class="match-details"><strong>⚽ Buteurs :</strong> ${m.buteurs}</div>`;
          if (m.passeurs) html += `<div class="match-details"><strong>👟 Passeurs :</strong> ${m.passeurs}</div>`;
        }

        html += `</div>`;
      });

      html += `</div>`;
      root.innerHTML = html;
    } catch (e) {
      root.innerHTML = `<h2>Matchs</h2><p style="color: red; text-align: center;">Erreur lors du chargement des matchs.</p>`;
    }
  }

  // --- STATISTIQUES ---
  async function renderStats() {
    root.innerHTML = `<h2>Statistiques</h2><p style="text-align: center;">Chargement des statistiques...</p>`;
    try {
      const res = await fetchFresh('players.json');
      const players = await res.json();

      // Gestion des clés variables selon la structure JSON
      const getNbMatchs = p => parseInt(p.matchs ?? p.matches ?? 0, 10) || 0;
      const getNbButs = p => parseInt(p.buts ?? 0, 10) || 0;
      const getNbPasses = p => parseInt(p.passes ?? 0, 10) || 0;
      const getJaunes = p => parseInt(p.cartons_jaunes ?? p.cartons?.jaunes ?? 0, 10) || 0;
      const getBlancs = p => parseInt(p.cartons_blancs ?? p.cartons?.blancs ?? 0, 10) || 0;
      const getRouges = p => parseInt(p.cartons_rouges ?? p.cartons?.rouges ?? 0, 10) || 0;

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
      root.innerHTML = `<h2>Statistiques</h2><p style="color: red; text-align: center;">Erreur lors du chargement des statistiques.</p>`;
    }
  }

  // --- NAVIGATION ---
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tab = btn.getAttribute('data-tab');
      if (tab === 'composition') renderComposition();
      else if (tab === 'matchs') renderMatchs();
      else if (tab === 'stats') renderStats();
    });
  });

  // Chargement de l'onglet par défaut (Composition)
  renderComposition();
});
