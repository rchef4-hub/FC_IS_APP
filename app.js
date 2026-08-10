document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  
  function renderHome() {
    root.innerHTML = `
      <h1>Bienvenue au F.C. IS</h1>
      <div style="text-align:center; margin-top:30px;">
        <p>Retrouvez tous les résultats, l'effectif et les dernières infos du club.</p>
        <p><em>Saison 2025-2026</em></p>
      </div>
    `;
  }

  // --- FONCTION ASYNCHRONE POUR LE CHARGEMENT DES MATCHS VIA JSON ---
  async function renderMatches() {
    root.innerHTML = `<h2>Calendrier des matchs</h2><p style="text-align: center;">Chargement du calendrier...</p>`;

    try {
      const response = await fetch('matchs.json'); 
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const matchs = await response.json();
      
      const matchsListHTML = matchs.map(match => {
        let detailsHTML = '';
        let statusClass = 'upcoming'; 

        if (match.resultat) {
          detailsHTML = `<p class="result">Résultat : <strong>${match.resultat}</strong></p>`;
          statusClass = match.resultat.toLowerCase().includes('victoire') ? 'win' : 'loss';
        } else {
          detailsHTML = ``; 
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

  // --- FONCTION ASYNCHRONE POUR LE CHARGEMENT DE L'EFFECTIF COMPLET ---
  async function renderPlayers() {
    root.innerHTML = `<h2>Effectif du Club</h2><p style="text-align: center;">Chargement des données...</p>`;

    try {
      // 1. Récupération SIMULTANÉE des trois fichiers JSON
      const [playersRes, dirigeantsRes, arbitresRes] = await Promise.all([
        fetch('players.json'),
        fetch('dirigeants.json'),
        fetch('arbitres.json')
      ]);

      if (!playersRes.ok || !dirigeantsRes.ok || !arbitresRes.ok) {
        throw new Error('Erreur de chargement d\'un ou plusieurs fichiers de l\'effectif.');
      }

      // 2. Conversion des réponses en objets/tableaux JavaScript
      const players = await playersRes.json();
      const dirigeants = await dirigeantsRes.json();
      const arbitres = await arbitresRes.json();
      
      let contentHTML = '<h2>Effectif du Club</h2>';

      // --- Section 1: Joueurs ---
      const playerListHTML = players.map(player => `
        <li>
          ${player.symbole} <strong>#${player.numero} ${player.nom}</strong>
          <br><small>${player.poste}</small>
        </li>
      `).join('');
      // NOTE: J'ajoute la classe 'collapsed' par défaut ici pour que seul 'Joueurs' soit ouvert
      contentHTML += `<h3 class="accordion-header active">⚽ Joueurs</h3><ul>${playerListHTML}</ul>`;

      // --- Section 2: Dirigeants ---
      const dirigeantsListHTML = dirigeants.map(dirigeant => `
        <li>
          ${dirigeant.symbole} <strong>${dirigeant.nom}</strong>
          <br><small>${dirigeant.fonction}</small>
        </li>
      `).join('');
      contentHTML += `<h3 class="accordion-header">👔 Dirigeants</h3><ul class="collapsed">${dirigeantsListHTML}</ul>`;

      // --- Section 3: Arbitres ---
      const arbitresListHTML = arbitres.map(arbitre => `
        <li>
          ${arbitre.symbole} <strong>${arbitre.nom}</strong>
          <br><small>Arbitre ${arbitre.categorie}</small>
        </li>
      `).join('');
      contentHTML += `<h3 class="accordion-header">📣 Arbitres</h3><ul class="collapsed">${arbitresListHTML}</ul>`;
      
      // 4. Affichage du contenu
      root.innerHTML = contentHTML;
      
      // 5. NOUVEAU : AJOUT DE LA LOGIQUE ACCORDÉON
      document.querySelectorAll('#root h3').forEach(header => {
          header.addEventListener('click', function() {
              const list = this.nextElementSibling; // Récupère le <ul> juste après le <h3>
              
              if (list && list.tagName === 'UL') {
                  // Toggle les classes pour l'animation et le changement de flèche
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

  // --- FONCTION ASYNCHRONE POUR LE CHARGEMENT DES ANNONCES VIA JSON ---
  async function renderAnnouncements() {
    root.innerHTML = `<h2>Annonces Club</h2><p style="text-align: center;">Chargement des annonces...</p>`;

    try {
      const response = await fetch('annonces.json');

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

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
      root.innerHTML = `<h2>Annonces Club</h2><p style="color: red; text-align: center;">Impossible de charger les annonces. Vérifiez le fichier annonces.json.</p>`;
    }
  }

  function router() {
    const hash = location.hash.replace('#','') || 'home';
    
    document.querySelectorAll('nav a').forEach(a => {
        a.classList.remove('active');
        if(a.getAttribute('href') === '#' + hash) a.classList.add('active');
    });

    if(hash === 'home') renderHome();
    else if(hash === 'matches') renderMatches();
    else if(hash === 'players') renderPlayers(); 
    else if(hash === 'announcements') renderAnnouncements();
    else renderHome();
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);
});
