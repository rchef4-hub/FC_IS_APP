document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  
  function fetchFresh(url) {
    return fetch(`${url}?t=${Date.now()}`);
  }

  function renderHome() {
    root.innerHTML = `
      <h1>Bienvenue au F.C. IS</h1>
      <div style="text-align:center; margin-top:30px;">
        <p>Retrouvez tous les résultats, l'effectif et les dernières infos du club.</p>
        <p><em>Saison 2026-2027</em></p>
      </div>
    `;
  }

  async function renderMatches() {
    root.innerHTML = `<h2>Calendrier & Résultats</h2><p style="text-align: center;">Chargement des matchs...</p>`;
    try {
      const response = await fetchFresh('matchs.json');
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const matches = await response.json();

      const matchesHTML = matches.map(m => {
        const isDomicile = m.lieu.toLowerCase().includes('domicile');
        const badgeColor = isDomicile ? '#28a745' : '#17a2b8';
        const resultatDisplay = m.resultat ? `<strong>${m.resultat}</strong>` : '<em>À venir</em>';

        return `
          <li style="border-left-color: ${badgeColor}; padding: 12px; margin-bottom: 10px; background: white; border-radius: 8px; box-shadow: var(--shadow); list-style: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <small style="color: #666; font-weight: bold;">📅 ${m.date}</small>
              <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">${m.lieu}</span>
            </div>
            <div style="font-size: 1.1em; margin-bottom: 5px;">
              <strong>vs ${m.adversaire}</strong>
            </div>
            <div style="color: var(--primary-color);">
              Score : ${resultatDisplay}
            </div>
          </li>
        `;
      }).join('');

      root.innerHTML = `<h2>Calendrier & Résultats</h2><ul style="padding: 0;">${matchesHTML}</ul>`;
    } catch (error) {
      console.error("Erreur matchs:", error);
      root.innerHTML = `<h2>Calendrier & Résultats</h2><p style="color: red; text-align: center;">Impossible de charger les matchs.</p>`;
    }
  }

  async function renderStats() {
    root.innerHTML = `<h2>Statistiques</h2><p style="text-align: center;">Chargement des statistiques...</p>`;
    try {
      const response = await fetchFresh('players.json');
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const players = await response.json();

      const topScorers = [...players].sort((a, b) => (parseInt(b.buts) || 0) - (parseInt(a.buts) || 0));
      const topPassers = [...players].sort((a, b) => (parseInt(b.passes) || 0) - (parseInt(a.passes) || 0));

      const scorersHTML = topScorers.map(p => `
        <li>
          <strong>${p.nom}</strong>
          <br><small>⚽ ${parseInt(p.buts) || 0} but(s) en ${parseInt(p.matchs) || 0} match(s)</small>
        </li>
      `).join('');

      const passersHTML = topPassers.map(p => `
        <li>
          <strong>${p.nom}</strong>
          <br><small>👟 ${parseInt(p.passes) || 0} passe(s) décisive(s)</small>
        </li>
      `).join('');

      root.innerHTML = `
        <h2>Statistiques de la Saison</h2>
        <h3 class="accordion-header active">⚽ Meilleurs Buteurs</h3>
        <ul>${scorersHTML}</ul>
        <h3 class="accordion-header active">👟 Meilleurs Passeurs</h3>
        <ul>${passersHTML}</ul>
      `;
    } catch (error) {
      console.error("Erreur stats:", error);
      root.innerHTML = `<h2>Statistiques</h2><p style="color: red; text-align: center;">Erreur dans le fichier players.json.</p>`;
    }
  }

  async function renderPlayers() {
    root.innerHTML = `<h2>Effectif du Club</h2><p style="text-align: center;">Chargement des données...</p>`;

    let players = [], dirigeants = [], arbitres = [];

    try {
      const res = await fetchFresh('players.json');
      if (res.ok) players = await res.json();
    } catch (e) { console.error("Erreur players.json", e); }

    try {
      const res = await fetchFresh('dirigeants.json');
      if (res.ok) dirigeants = await res.json();
    } catch (e) { console.error("Erreur dirigeants.json", e); }

    try {
      const res = await fetchFresh('arbitres.json');
      if (res.ok) arbitres = await res.json();
    } catch (e) { console.error("Erreur arbitres.json", e); }

    let contentHTML = '<h2>Effectif du Club</h2>';

    if (players.length > 0) {
      const playerListHTML = players.map(player => `
        <li>
          ${player.symbole || '⚽'} <strong>#${player.numero || ''} ${player.nom}</strong>
          <br><small>${player.poste || ''}</small>
        </li>
      `).join('');
      contentHTML += `<h3 class="accordion-header active">⚽ Joueurs</h3><ul>${playerListHTML}</ul>`;
    } else {
      contentHTML += `<p style="color:red; text-align:center;">Erreur de lecture de players.json</p>`;
    }

    if (dirigeants.length > 0) {
      const dirigeantsListHTML = dirigeants.map(dirigeant => `
        <li>
          ${dirigeant.symbole || '👔'} <strong>${dirigeant.nom}</strong>
          <br><small>${dirigeant.fonction || ''}</small>
        </li>
      `).join('');
      contentHTML += `<h3 class="accordion-header">👔 Dirigeants</h3><ul class="collapsed">${dirigeantsListHTML}</ul>`;
    }

    if (arbitres.length > 0) {
      const arbitresListHTML = arbitres.map(arbitre => `
        <li>
          ${arbitre.symbole || '📣'} <strong>${arbitre.nom}</strong>
          <br><small>Arbitre ${arbitre.categorie || ''}</small>
        </li>
      `).join('');
      contentHTML += `<h3 class="accordion-header">📣 Arbitres</h3><ul class="collapsed">${arbitresListHTML}</ul>`;
    }

    root.innerHTML = contentHTML;

    document.querySelectorAll('#root h3').forEach(header => {
      header.addEventListener('click', function() {
        const list = this.nextElementSibling;
        if (list && list.tagName === 'UL') {
          list.classList.toggle('collapsed'); 
          this.classList.toggle('active');
        }
      });
    });
  }

  async function renderAnnouncements() {
    root.innerHTML = `<h2>Annonces Club</h2><p style="text-align: center;">Chargement des annonces...</p>`;
    try {
      const response = await fetchFresh('annonces.json');
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const annonces = await response.json();
      
      const annoncesListHTML = annonces.map(annonce => `
        <li style="border-left-color: ${annonce.couleur_bordure || 'var(--primary-color)'};">
          ${annonce.symbole} <strong>${annonce.titre}</strong>
          <br>${annonce.details}
        </li>
      `).join('');
      
      root.innerHTML = `<h2>Annonces Club</h2><ul>${annoncesListHTML}</ul>`;
    } catch (error) {
      console.error("Erreur annonces:", error);
      root.innerHTML = `<h2>Annonces Club</h2><p style="color: red; text-align: center;">Impossible de charger les annonces.</p>`;
    }
  }

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

      let matchOptions = matches.map((m, idx) => 
        `<option value="${idx}">${m.date} - vs ${m.adversaire} (${m.lieu})</option>`
      ).join('');

      let playerOptions = players.map(p => 
        `<option value="${p.nom}">${p.nom}</option>`
      ).join('');

      let playerCheckboxList = players.map(p => `
        <label style="display:block; margin: 5px 0; font-size: 0.95em;">
          <input type="checkbox" class="presence-check" value="${p.nom}">
          #${p.numero} ${p.nom} (${p.poste})
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
          <input type="text" id="match-score" placeholder="Ex: Victoire 3-1" style="width: 100%; padding: 8px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #ccc;">

          <label style="font-weight: bold; display: block; margin-bottom: 5px;">3. Joueurs Présents :</label>
          <div style="max-height: 150px; overflow-y: auto; background: #f8f9fa; padding: 8px; border-radius: 6px; margin-bottom: 15px;">
            ${playerCheckboxList}
          </div>

          <label style="font-weight: bold; display: block; margin-bottom: 5px;">4. Ajouter Buteur / Passeur :</label>
          <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            <select id="select-buteur" style="flex: 1; padding: 6px; border-radius: 6px;">
              <option value="">-- Buteur --</option>
              ${playerOptions}
            </select>
            <select id="select-passeur" style="flex: 1; padding: 6px; border-radius: 6px;">
              <option value="">-- Passeur --</option>
              ${playerOptions}
            </select>
            <button id="btn-add-goal" style="background: var(--primary-color); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">+ Ajouter</button>
          </div>

          <ul id="goals-list" style="margin-bottom: 15px; padding-left: 20px;"></ul>

          <button id="btn-save-direct" style="width: 100%; background: #28a745; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 1em; cursor: pointer; margin-bottom: 15px;">
            🚀 Publier le match sur GitHub
          </button>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

          <button id="btn-reset-all" style="width: 100%; background: #dc3545; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 0.9em; cursor: pointer;">
            🔄 Remettre à ZÉRO les statistiques & résultats
          </button>

          <p id="status-message" style="text-align:center; font-weight:bold; margin-top:10px;"></p>
        </div>
      `;

      let events = [];

      document.getElementById('btn-add-goal').addEventListener('click', () => {
        const buteurSelect = document.getElementById('select-buteur');
        const passeurSelect = document.getElementById('select-passeur');
        const buteur = buteurSelect.value;
        const passeur = passeurSelect.value;

        if (!buteur) {
          alert('Veuillez sélectionner un buteur.');
          return;
        }

        events.push({ buteur: buteur, passeur: passeur });
        const goalsList = document.getElementById('goals-list');
        const li = document.createElement('li');
        li.style.borderLeft = "none";
        li.style.padding = "4px";
        li.innerHTML = `⚽ <strong>${buteur}</strong> ${passeur ? '(passe : ' + passeur + ')' : ''}`;
        goalsList.appendChild(li);

        buteurSelect.value = '';
        passeurSelect.value = '';
      });

      async function updateGitHubFile(filePath, newContent, commitMessage) {
        const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
        const getRes = await fetch(getUrl, { headers: { 'Authorization': `token ${githubToken}` } });
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

        if (!putRes.ok) throw new Error(`Erreur lors de la mise à jour de ${filePath}`);
      }

      document.getElementById('btn-save-direct').addEventListener('click', async () => {
        const statusMsg = document.getElementById('status-message');
        statusMsg.style.color = "orange";
        statusMsg.innerText = "⏳ Envoi des données...";

        try {
          const selectedMatchIdx = document.getElementById('select-match').value;
          const score = document.getElementById('match-score').value;
          const checkedBoxes = document.querySelectorAll('.presence-check:checked');
          const presentNames = Array.from(checkedBoxes).map(cb => cb.value);

          let butsMap = {}, passesMap = {};
          events.forEach(e => {
            if (e.buteur) butsMap[e.buteur] = (butsMap[e.buteur] || 0) + 1;
            if (e.passeur) passesMap[e.passeur] = (passesMap[e.passeur] || 0) + 1;
          });

          const updatedPlayers = players.map(p => {
            let updatedP = { ...p };
            let currentMatchs = parseInt(updatedP.matchs) || 0;
            let currentButs = parseInt(updatedP.buts) || 0;
            let currentPasses = parseInt(updatedP.passes) || 0;

            if (presentNames.includes(p.nom)) currentMatchs += 1;
            if (butsMap[p.nom]) currentButs += butsMap[p.nom];
            if (passesMap[p.nom]) currentPasses += passesMap[p.nom];

            updatedP.matchs = currentMatchs;
            updatedP.buts = currentButs;
            updatedP.passes = currentPasses;
            return updatedP;
          });

          const updatedMatches = [...matches];
          if (score) updatedMatches[selectedMatchIdx].resultat = score;

          await updateGitHubFile('players.json', updatedPlayers, 'Update players via app');
          await updateGitHubFile('matchs.json', updatedMatches, 'Update matchs via app');

          statusMsg.style.color = "green";
          statusMsg.innerText = "✅ Match enregistré avec succès !";
          events = [];
        } catch (err) {
          console.error(err);
          statusMsg.style.color = "red";
          statusMsg.innerText = "❌ Erreur d'enregistrement.";
        }
      });

      document.getElementById('btn-reset-all').addEventListener('click', async () => {
        if (!confirm("⚠️ Remettre TOUTES les stats à ZÉRO ?")) return;

        const statusMsg = document.getElementById('status-message');
        statusMsg.style.color = "orange";
        statusMsg.innerText = "⏳ Réinitialisation...";

        try {
          const resetPlayers = players.map(p => ({ ...p, matchs: 0, buts: 0, passes: 0 }));
          const resetMatches = matches.map(m => ({ ...m, resultat: "" }));

          await updateGitHubFile('players.json', resetPlayers, 'Reset stats to zero');
          await updateGitHubFile('matchs.json', resetMatches, 'Reset match scores');

          statusMsg.style.color = "green";
          statusMsg.innerText = "✅ Réinitialisation réussie !";
        } catch (err) {
          console.error(err);
          statusMsg.style.color = "red";
          statusMsg.innerText = "❌ Erreur lors de la réinitialisation.";
        }
      });

    } catch (err) {
      console.error(err);
      root.innerHTML = `<h2>Saisie</h2><p style="color:red; text-align:center;">Erreur de chargement des données.</p>`;
    }
  }

  function router() {
    const hash = location.hash.replace('#','') || 'home';
    document.querySelectorAll('nav a').forEach(a => {
        a.classList.remove('active');
        const href = a.getAttribute('href');
        if(href === '#' + hash || (hash.startsWith('match') && href.startsWith('#match'))) {
          a.classList.add('active');
        }
    });

    if(hash === 'home') renderHome();
    else if(hash === 'matches' || hash === 'matchs') renderMatches();
    else if(hash === 'stats') renderStats();
    else if(hash === 'players') renderPlayers(); 
    else if(hash === 'announcements') renderAnnouncements();
    else if(hash === 'admin') renderAdmin();
    else renderHome();
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);
});
