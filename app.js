document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");

  function fetchFresh(url) {
    return fetch(`${url}?_=${Date.now()}`, { cache: "no-store" });
  }

  function getScoreColor(resultat) {
    if (!resultat || resultat.trim() === '') return '#555';
    const res = resultat.toLowerCase();

    if (res.includes('victoire')) return '#2e7d32';
    if (res.includes('défaite') || res.includes('defaite')) return '#c62828';
    if (res.includes('nul')) return '#ef6c00';

    const nums = resultat.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const n1 = parseInt(nums[0], 10);
      const n2 = parseInt(nums[1], 10);
      if (n1 > n2) return '#2e7d32';
      if (n1 < n2) return '#c62828';
      return '#ef6c00';
    }
    return '#6b1d44';
  }

  // --- PAGE ACCUEIL (#home) ---
  async function renderAccueil() {
    root.innerHTML = `<p style="text-align: center;">Chargement de l'accueil...</p>`;
    try {
      const [resMatchs, resPlayers] = await Promise.all([
        fetchFresh('matchs.json'),
        fetchFresh('players.json')
      ]);

      const matchs = await resMatchs.json();
      const players = await resPlayers.json();

      const joues = matchs.filter(m => m.resultat && m.resultat.trim() !== '');
      const aVenir = matchs.filter(m => !m.resultat || m.resultat.trim() === '');

      const dernierMatch = joues.length > 0 ? joues[joues.length - 1] : null;
      const prochainMatch = aVenir.length > 0 ? aVenir[0] : null;

      const moisActuel = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const anniversaires = players.filter(p => {
        if (!p.naissance) return false;
        const parts = p.naissance.split('/');
        return parts.length === 3 && parts[1] === moisActuel;
      });

      let html = `
        <div class="accueil-container">
          <p style="text-align: center; font-style: italic; color: #555;">Saison 2026-2027</p>

          <div class="banner-boutique" style="background: #6b1d44; padding: 10px 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; color: white; margin-bottom: 15px;">
            <span>🛍️ <strong>Boutique Officielle JAKO</strong></span>
            <a href="#" style="background: rgba(255,255,255,0.2); color: white; text-decoration: none; padding: 5px 12px; border-radius: 15px; font-size: 0.9em;">Visiter ↗</a>
          </div>

          <div class="card" style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="background: #6b1d44; color: white; text-align: center; padding: 8px; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">
              ⚽ Dernier Match
            </div>
      `;

      if (dernierMatch) {
        const c = getScoreColor(dernierMatch.resultat);
        html += `
          <div style="text-align: center;">
            <p style="margin: 5px 0; color: #666; font-size: 0.9em;">📅 ${dernierMatch.date}</p>
            <p style="font-size: 1.1em; margin: 10px 0;"><strong>vs ${dernierMatch.adversaire}</strong> (${dernierMatch.lieu})</p>
            <p style="font-size: 1.2em; font-weight: bold; color: ${c};">${dernierMatch.resultat}</p>
            ${dernierMatch.buteurs ? `<p style="font-size: 0.85em; color: #444; margin-top: 5px;">⚽ ${dernierMatch.buteurs}</p>` : ''}
          </div>
        `;
      } else {
        html += `<p style="text-align: center; color: #777;">Aucun résultat récent</p>`;
      }

      html += `</div>`;

      html += `
          <div class="card" style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="background: #6b1d44; color: white; text-align: center; padding: 8px; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">
              ⏳ Prochain Match
            </div>
      `;

      if (prochainMatch) {
        html += `
          <div style="text-align: center;">
            <p style="margin: 5px 0; color: #666; font-size: 0.9em;">📅 ${prochainMatch.date}</p>
            <p style="font-size: 1.1em; margin: 10px 0;"><strong>vs ${prochainMatch.adversaire}</strong></p>
            <p style="font-size: 0.9em; color: #888;">📍 Match à ${prochainMatch.lieu}</p>
          </div>
        `;
      } else {
        html += `<p style="text-align: center; color: #777;">Aucun match à venir</p>`;
      }

      html += `</div>`;

      html += `
          <div class="card" style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="background: #6b1d44; color: white; text-align: center; padding: 8px; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">
              🎉 Anniversaires du mois
            </div>
      `;

      if (anniversaires.length > 0) {
        anniversaires.forEach(p => {
          const jourMois = p.naissance.substring(0, 5);
          html += `
            <div style="display: flex; justify-content: space-between; background: #f9f9f9; padding: 8px 12px; margin-bottom: 6px; border-radius: 5px; border-left: 4px solid #d4af37;">
              <span>⚽ <strong>${p.nom.toUpperCase()}</strong></span>
              <span style="color: #6b1d44; font-weight: bold;">${jourMois}</span>
            </div>
          `;
        });
      } else {
        html += `<p style="text-align: center; color: #777;">Aucun anniversaire ce mois-ci</p>`;
      }

      html += `</div></div>`;
      root.innerHTML = html;
    } catch (e) {
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement de l'accueil.</p>`;
    }
  }

  // --- PAGE MATCHS (#matches) ---
  async function renderMatchs() {
    root.innerHTML = `<p style="text-align: center;">Chargement des matchs...</p>`;
    try {
      const res = await fetchFresh('matchs.json');
      const matchs = await res.json();

      let html = `<h2 style="color: #6b1d44; text-align: center; margin-bottom: 15px;">Calendrier & Résultats</h2><div class="matchs-list" style="display: flex; flex-direction: column; gap: 15px;">`;

      matchs.forEach(m => {
        const isDomicile = m.lieu === 'Domicile';
        const badgeColor = isDomicile ? '#2e7d32' : '#00838f';
        const statusText = m.resultat && m.resultat.trim() !== '' ? m.resultat : 'À venir';
        const color = getScoreColor(m.resultat);

        html += `
          <div class="match-card" style="background: white; border-radius: 10px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 5px solid ${badgeColor}; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.9em; color: #555; font-weight: 500;">📅 ${m.date || ''}</span>
              <span style="background: ${badgeColor}; color: white; padding: 3px 12px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">${m.lieu || 'Domicile'}</span>
            </div>

            <div style="font-size: 1.1em; font-weight: bold; color: #222; margin: 6px 0;">
              vs ${m.adversaire}
            </div>

            <div style="font-size: 0.95em; margin-top: 4px;">
              Score : <strong style="color: ${color};">${statusText}</strong>
            </div>
        `;

        if (m.buteurs && m.buteurs.trim() !== '') {
          html += `<div style="font-size: 0.88em; color: #444; margin-top: 8px; border-top: 1px dashed #eee; padding-top: 6px;">⚽ <strong>Buteurs :</strong> ${m.buteurs}</div>`;
        }

        if (m.passeurs && m.passeurs.trim() !== '') {
          html += `<div style="font-size: 0.88em; color: #444; margin-top: 4px;">👟 <strong>Passeurs :</strong> ${m.passeurs}</div>`;
        }

        html += `</div>`;
      });

      html += `</div>`;
      root.innerHTML = html;
    } catch (e) {
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement des matchs.</p>`;
    }
  }

  // --- PAGE EFFECTIF (#players) ---
  async function renderEffectif() {
    root.innerHTML = `<p style="text-align: center;">Chargement des joueurs...</p>`;
    try {
      const res = await fetchFresh('players.json');
      const players = await res.json();

      let html = `<h2 style="color: #6b1d44; text-align: center; margin-bottom: 15px;">Effectif de l'équipe</h2>`;
      html += `<div class="players-list" style="display: flex; flex-direction: column; gap: 10px;">`;

      players.forEach(p => {
        html += `
          <div class="player-card" style="background: white; border-radius: 8px; padding: 12px 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #6b1d44;">
            <div>
              <strong style="font-size: 1.05em; color: #222;">${p.symbole || '⚽'} ${p.nom}</strong>
              <div style="font-size: 0.85em; color: #666; margin-top: 2px;">${p.poste || 'Joueur'}</div>
            </div>
            <div style="text-align: right; font-size: 0.9em; color: #444;">
              <div>📋 Matchs : <strong>${p.matchs || 0}</strong></div>
              <div>⚽ Buts : <strong style="color: #2e7d32;">${p.buts || 0}</strong> | 👟 Passes : <strong style="color: #00838f;">${p.passes || 0}</strong></div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
      root.innerHTML = html;
    } catch (e) {
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement des joueurs.</p>`;
    }
  }

  // --- PAGE STATS (#stats) ---
  async function renderStats() {
    root.innerHTML = `<p style="text-align: center;">Chargement des statistiques...</p>`;
    try {
      const [resMatchs, resPlayers] = await Promise.all([
        fetchFresh('matchs.json'),
        fetchFresh('players.json')
      ]);

      const matchs = await resMatchs.json();
      const players = await resPlayers.json();

      const joues = matchs.filter(m => m.resultat && m.resultat.trim() !== '');
      let victoires = 0;
      let nuls = 0;
      let defaites = 0;
      let butsPour = 0;
      let butsContre = 0;

      joues.forEach(m => {
        const res = m.resultat.toLowerCase();
        if (res.includes('victoire')) victoires++;
        else if (res.includes('nul')) nuls++;
        else if (res.includes('défaite') || res.includes('defaite')) defaites++;

        const nums = m.resultat.match(/\d+/g);
        if (nums && nums.length >= 2) {
          const n1 = parseInt(nums[0], 10);
          const n2 = parseInt(nums[1], 10);
          if (n1 > n2) victoires++; // Note: Sécurité si format texte manquant
          // Extraction simple basée sur le texte ou les chiffres si besoin
        }
      });

      // Top Buteurs & Passeurs triés
      const topButeurs = [...players].sort((a, b) => (b.buts || 0) - (a.buts || 0)).slice(0, 5);
      const topPasseurs = [...players].sort((a, b) => (b.passes || 0) - (a.passes || 0)).slice(0, 5);

      let html = `
        <h2 style="color: #6b1d44; text-align: center; margin-bottom: 15px;">Statistiques de la Saison</h2>
        
        <!-- Bilan Global -->
        <div class="card" style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
          <div style="background: #6b1d44; color: white; text-align: center; padding: 8px; border-radius: 6px; font-weight: bold; margin-bottom: 12px;">
            📊 Bilan de l'équipe (${joues.length} matchs joués)
          </div>
          <div style="display: flex; justify-content: space-around; text-align: center;">
            <div>
              <div style="font-size: 1.3em; font-weight: bold; color: #2e7d32;">${victoires}</div>
              <div style="font-size: 0.85em; color: #666;">Victoires</div>
            </div>
            <div>
              <div style="font-size: 1.3em; font-weight: bold; color: #ef6c00;">${nuls}</div>
              <div style="font-size: 0.85em; color: #666;">Nuls</div>
            </div>
            <div>
              <div style="font-size: 1.3em; font-weight: bold; color: #c62828;">${defaites}</div>
              <div style="font-size: 0.85em; color: #666;">Défaites</div>
            </div>
          </div>
        </div>

        <!-- Top Buteurs -->
        <div class="card" style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
          <div style="background: #2e7d32; color: white; text-align: center; padding: 8px; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">
            ⚽ Meilleurs Buteurs
          </div>
      `;

      topButeurs.forEach((p, index) => {
        if ((p.buts || 0) > 0) {
          html += `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f1f1; font-size: 0.95em;">
              <span>${index + 1}. <strong>${p.nom}</strong></span>
              <span style="color: #2e7d32; font-weight: bold;">${p.buts} buts</span>
            </div>
          `;
        }
      });

      html += `</div>`;

      // Top Passeurs
      html += `
        <div class="card" style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
          <div style="background: #00838f; color: white; text-align: center; padding: 8px; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">
            👟 Meilleurs Passeurs
          </div>
      `;

      topPasseurs.forEach((p, index) => {
        if ((p.passes || 0) > 0) {
          html += `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f1f1; font-size: 0.95em;">
              <span>${index + 1}. <strong>${p.nom}</strong></span>
              <span style="color: #00838f; font-weight: bold;">${p.passes} passes</span>
            </div>
          `;
        }
      });

      html += `</div>`;
      root.innerHTML = html;
    } catch (e) {
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement des statistiques.</p>`;
    }
  }

  function renderAnnonces() {
    root.innerHTML = `<h2 style="color: #6b1d44; text-align: center;">Annonces</h2><p style="text-align: center; color: #666;">Aucune annonce pour le moment.</p>`;
  }

  function renderAdmin() {
    root.innerHTML = `<h2 style="color: #6b1d44; text-align: center;">Administration</h2><p style="text-align: center; color: #666;">Panneau d'administration.</p>`;
  }

  // --- ROUTEUR PRINCIPAL ---
  function navigate() {
    const hash = window.location.hash || '#home';

    document.querySelectorAll("nav a").forEach(a => {
      if (a.getAttribute("href") === hash) {
        a.classList.add("active");
      } else {
        a.classList.remove("active");
      }
    });

    switch (hash) {
      case '#matches':
        renderMatchs();
        break;
      case '#players':
        renderEffectif();
        break;
      case '#stats':
        renderStats();
        break;
      case '#announcements':
        renderAnnonces();
        break;
      case '#admin':
        renderAdmin();
        break;
      case '#home':
      default:
        renderAccueil();
        break;
    }
  }

  window.addEventListener("hashchange", navigate);

  document.addEventListener("click", (e) => {
    const link = e.target.closest("nav a");
    if (link) {
      const targetHash = link.getAttribute("href");
      if (targetHash && targetHash.startsWith("#")) {
        window.location.hash = targetHash;
        navigate();
      }
    }
  });

  navigate();
});
