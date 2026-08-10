document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  
  // --- PAGE D'ACCUEIL ---
  function renderHome() {
    root.innerHTML = `
      <h1>Bienvenue au F.C. IS</h1>
      <div style="text-align:center; margin-top:30px;">
        <p>Retrouvez tous les résultats, l'effectif et les dernières infos du club.</p>
        <p><em>Saison 2025-2026</em></p>
      </div>
    `;
  }

  // --- CALENDRIER DES MATCHS ---
  async function renderMatches() {
    root.innerHTML = `<h2>Calendrier des matchs</h2><p style="text-align: center;">Chargement du calendrier...</p>`;

    try {
      const response = await fetch('matchs.json'); 
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      const matchs = await response.json();
      
      const matchsListHTML = matchs.map(match => {
        let detailsHTML = '';
        let statusClass = 'upcoming'; 

        if (match.resultat) {
          detailsHTML = `<p class="result">Résultat : <strong>${match.resultat}</strong></p>`;
          statusClass = match.resultat.toLowerCase().includes('victoire') ? 'win' : 'loss';
        }

        return `
          <li class="${statusClass}">
            <strong>vs ${match.adversaire}</strong>
            <br><small>${match.date} à ${match.heure} - ${match.lieu}</small>
            ${detailsHTML}
          </li>
        `;
      }).join('');
      
      root.innerHTML = `<h2>Calendrier des matchs</h2><ul>${matchsListHTML}</ul>`;
      
    } catch (error) {
      console.error("Erreur de chargement des matchs :", error);
      root.innerHTML = `<h2>Matchs</h2><p style="color: red; text-align: center;">Impossible de charger le calendrier.</p>`;
    }
  }

  // --- STATISTIQUES ---
  async function renderStats() {
    root.innerHTML = `<h2>Statistiques</h2><p style="text-align: center;">Chargement des statistiques...</p>`;

    try {
      const response = await fetch('players.json');
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      const players = await response.json();

      const topScorers = [...players].sort((a, b) => (b.buts || 0) - (a.buts || 0));
      const topPassers = [...players].sort((a, b) => (b.passes || 0) - (a.passes || 0));

      const scorersHTML = topScorers.map(p => `
        <li>
          <strong>${p.nom}</strong>
          <br><small>⚽ ${p.buts || 0} but(s) en ${p.matchs || 0} match(s)</small>
        </li>
      `).join('');

      const passersHTML = topPassers.map(p => `
        <li>
          <strong>${p.nom}</strong>
          <br><small>👟 ${p.passes || 0} passe(s) décisive(s)</small>
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
      console.error("Erreur de chargement des stats :", error);
      root.innerHTML = `<h2>Statistiques</h2><p style="color: red; text-align: center;">Impossible de charger les statistiques.</p>`;
    }
  }

  // --- EFFECTIF COMPLET ---
  async function renderPlayers() {
    root.innerHTML = `<h2>Effectif du Club</h2><p style="text-align: center;">Chargement des données...</p>`;

    try {
      const [playersRes, dirigeantsRes, arbitresRes] = await Promise.all([
        fetch('players.json'),
        fetch('dirigeants.json'),
        fetch('arbitres.json')
      ]);

      if (!playersRes.ok || !dirigeantsRes.ok || !arbitresRes.ok) {
        throw new Error('Erreur de chargement d\'un ou plusieurs fichiers de l\'effectif.');
      }

      const players = await playersRes.json();
      const dirigeants = await dirigeantsRes.json();
      const arbitres = await arbitresRes.json();
      
      let contentHTML = '<h2>Effectif du Club</h2>';

      const playerListHTML = players.map(player => `
        <li>
          ${player.symbole} <strong>#${player.numero} ${player.nom}</strong>
          <br><small>${player.poste}</small>
        </li>
      `).join('');
      contentHTML += `<h3 class="accordion-header active">⚽ Joueurs</h3><ul>${playerListHTML}</ul>`;

      const dirigeantsListHTML = dirigeants.map(dirigeant => `
        <li>
          ${dirigeant.symbole} <strong>${dirigeant.nom}</strong>
          <br><small>${dirigeant.fonction}</small>
        </li>
      `).join('');
      contentHTML += `<h3 class="accordion-header">👔 Dirigeants</h3><ul class="collapsed">${dirigeantsListHTML}</ul>`;

      const arbitresListHTML = arbitres.map(arbitre => `
        <li>
          ${arbitre.symbole} <strong>${arbitre.nom}</strong>
          <br><small>Arbitre ${arbitre.categorie}</small>
        </li>
      `).join('');
      contentHTML += `<h3 class="accordion-header">📣 Arbitres</h3><ul class="collapsed">${arbitresListHTML}</ul>`;
      
      root.innerHTML = contentHTML;
      
      // Logique Accordéon
      document.querySelectorAll('#root h3').forEach(header => {
        header.addEventListener('click', function() {
          const list = this.nextElementSibling;
          if (list && list.tagName === 'UL') {
            list.classList.toggle('collapsed'); 
            this.classList.toggle('active');
          }
        });
      });
      
    } catch (error) {
      console.error("Erreur de chargement de l'effectif :", error);
      root.innerHTML = `<h2>Effectif</h2><p style="color: red; text-align: center;">Impossible de charger la liste complète.</p>`;
    }
  }

  // --- ANNONCES ---
  async function renderAnnouncements() {
    root.innerHTML = `<h2>Annonces Club</h2><p style="text-align: center;">Chargement des annonces...</p>`;

    try {
      const response = await fetch('annonces.json');
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
      console.error("Erreur de chargement des annonces :", error);
      root.innerHTML = `<h2>Annonces Club</h2><p style="color: red; text-align: center;">Impossible de charger les annonces.</p>`;
    }
  }

  // --- SAISIE MATCH (ADMINISTRATEUR) ---
  async function renderAdmin() {
    const password = prompt("Veuillez entrer le mot de passe administrateur :");
    
    if (password !== "FCIS2026") {
      alert("Mot de passe incorrect !");
      window.location.hash = "home";
      return;
    }

    root.innerHTML = `<h2>⚙️ Saisie de Match</h2><p style="text-align: center;">Chargement du formulaire...</p>`;

    try {
      const [playersRes, matchesRes] = await Promise.all([
        fetch('players.json'),
        fetch('matchs.json')
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
          <input type="checkbox" class="presence-check" value="${p.nom}" checked>
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
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <input type="text" id="match-score" placeholder="Ex: Victoire 3-1 ou Défaite 0-2" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc;">
          </div>

          <label style="font-weight: bold; display: block; margin-bottom: 5px;">3. Joueurs Présents :</label>
          <div style="max-height: 150px; overflow-y: auto; background: #f8f9fa; padding: 8px; border-radius: 6px; margin-bottom: 15px;">
            ${playerCheckboxList}
          </div>

          <label style="font-weight: bold; display: block; margin-bottom: 5px;">4. Ajouter un Buteur / Passeur :</label>
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

          <button id="btn-generate" style="width: 100%; background: #28a745; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 1em; cursor: pointer;">
            💾 Générer le JSON mis à jour
          </button>
        </div>

        <div id="output-container" style="display:none; margin-top: 20px; background: white; padding: 15px; border-radius: 12px; box-shadow: var(--shadow);">
          <h3>Code à copier dans GitHub :</h3>
          <p style="font-size: 0.85em; color: #666;">Copie le bloc ci-dessous dans <strong>players.json</strong> :</p>
          <textarea id="json-players-output" style="width: 100%; height: 120px; font-family: monospace; font-size: 0.8em;"></textarea>
          
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;">Copie le bloc ci-dessous dans <strong>matchs.json</strong> :</p>
          <textarea id="json-matches-output" style="width: 100%; height: 120px; font-family: monospace; font-size: 0.8em;"></textarea>
        </div>
      `;

      let events = [];

      document.getElementById('btn-add-goal').addEventListener('click', () => {
        const buteur = document.getElementById('select-buteur').value;
        const passeur = document.getElementById('select-passeur').value;

        if (!buteur) {
          alert('Veuillez sélectionner au moins un buteur.');
          return;
        }

        events.push({ buteur, passeur });
        
        const goalsList = document.getElementById('goals-list');
        const li = document.createElement('li');
        li.style.borderLeft = "none";
        li.style.padding = "4px";
        li.innerHTML = `⚽ <strong>${buteur}</strong> ${passeur ? '(passe : ' + passeur + ')' : ''}`;
        goalsList.appendChild(li);

        document.getElementById('select-buteur').value = '';
        document.getElementById('select-passeur').value = '';
      });

      document.getElementById('btn-generate').addEventListener('click', () => {
        const selectedMatchIdx = document.getElementById('select-match').value;
        const score = document.getElementById('match-score').value;

        const checkedBoxes = document.querySelectorAll('.presence-check:checked');
        const presentNames = Array.from(checkedBoxes).map(cb => cb.value);

        const updatedPlayers = players.map(p => {
          let updatedP = { ...p };
          if (presentNames.includes(p.nom)) {
            updatedP.matchs = (updatedP.matchs || 0) + 1;
          }
          events.forEach(e => {
            if (e.buteur === p.nom) updatedP.buts = (updatedP.buts || 0) + 1;
            if (e.passeur === p.nom) updatedP.passes = (updatedP.passes || 0) + 1;
          });
          return updatedP;
        });

        const updatedMatches = [...matches];
        if (score) {
          updatedMatches[selectedMatchIdx].resultat = score;
        }

        document.getElementById('json-players-output').value = JSON.stringify(updatedPlayers, null, 2);
        document.getElementById('json-matches-output').value = JSON.stringify(updatedMatches, null, 2);
        document.getElementById('output-container').style.display = 'block';
        window.scrollTo(0, document.body.scrollHeight);
      });

    } catch (err) {
      console.error(err);
      root.innerHTML = `<h2>Saisie</h2><p style="color:red; text-align:center;">Erreur de chargement des données.</p>`;
    }
  }

  // --- ROUTEUR PRINCIPAL ---
  function router() {
    const hash = location.hash.replace('#','') || 'home';
    
    document.querySelectorAll('nav a').forEach(a => {
        a.classList.remove('active');
        if(a.getAttribute('href') === '#' + hash) a.classList.add('active');
    });

    if(hash === 'home') renderHome();
    else if(hash === 'matches') renderMatches();
    else if(hash === 'stats') renderStats();
    else if(hash === 'players') renderPlayers(); 
    else if(hash === 'announcements') renderAnnouncements();
    else if(hash === 'admin') renderAdmin();
    else renderHome();
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);
});
