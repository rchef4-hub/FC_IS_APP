document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");

  // Requête anti-cache
  function fetchFresh(url) {
    return fetch(`${url}?_=${Date.now()}`, { cache: "no-store" });
  }

  // Obtenir la couleur du score
  function getScoreColor(resultat) {
    if (!resultat || resultat.trim() === '') return '#555';
    const res = resultat.toLowerCase();

    if (res.includes('victoire')) return '#2e7d32'; // Vert
    if (res.includes('défaite') || res.includes('defaite')) return '#c62828'; // Rouge
    if (res.includes('nul')) return '#ef6c00'; // Orange

    // Si seulement des chiffres (ex: "2 - 0" ou "0 - 9")
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

  // --- PAGE ACCUEIL ---
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

          <!-- DERNIER MATCH -->
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

      html += `
          </div>

          <!-- PROCHAIN MATCH -->
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

      html += `
          </div>

          <!-- ANNIVERSAIRES -->
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

      html += `
          </div>
        </div>
      `;

      root.innerHTML = html;
    } catch (e) {
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement de l'accueil.</p>`;
    }
  }

  // --- PAGE EFFECTIF ---
  async function renderEffectif() {
    root.innerHTML = `<p style="text-align: center;">Chargement des joueurs...</p>`;
    try {
      const res = await fetchFresh('players.json');
      const players = await res.json();

      let html = `<h2>Effectif & Statistiques</h2><div class="players-list">`;

      players.forEach(p => {
        html += `
          <div class="player-card" style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${p.symbole || '⚽'} ${p.nom}</strong>
              <div style="font-size: 0.85em; color: #666;">${p.poste || 'Joueur'}</div>
            </div>
            <div style="text-align: right; font-size: 0.9em;">
              <div>📋 Matchs: <strong>${p.matchs || 0}</strong></div>
              <div>⚽ Buts: <strong>${p.buts || 0}</strong> | 👟 Passes: <strong>${p.passes || 0}</strong></div>
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

  // --- PAGE MATCHS ---
  async function renderMatchs() {
    root.innerHTML = `<p style="text-align: center;">Chargement des matchs...</p>`;
    try {
      const res = await fetchFresh('matchs.json');
      const matchs = await res.json();

      let html = `<h2>Calendrier & Résultats</h2><div class="matchs-list" style="display: flex; flex-direction: column; gap: 15px;">`;

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

  // --- ROUTEUR SIMPLE ---
  function navigate() {
    const hash = window.location.hash || '#accueil';

    document.querySelectorAll("nav a").forEach(a => {
      if (a.getAttribute("href") === hash) {
        a.classList.add("active");
      } else {
        a.classList.remove("active");
      }
    });

    if (hash === '#effectif') {
      renderEffectif();
    } else if (hash === '#matchs') {
      renderMatchs();
    } else {
      renderAccueil();
    }
  }

  window.addEventListener("hashchange", navigate);

  // Clic sur les liens de navigation
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
