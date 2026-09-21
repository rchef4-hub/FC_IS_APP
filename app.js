document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  const navLinks = document.querySelectorAll("nav a");

  // Fonction utilitaire pour éviter le cache navigateur lors des requêtes fetch
  async function fetchFresh(url) {
    const freshUrl = `${url}?_=${Date.now()}`;
    return fetch(freshUrl, { cache: 'no-store' });
  }

  // --- ACCUEIL ---
  async function renderAccueil() {
    root.innerHTML = `<p style="text-align: center;">Chargement de l'accueil...</p>`;
    try {
      const [resMatchs, resPlayers] = await Promise.all([
        fetchFresh('matchs.json'),
        fetchFresh('players.json')
      ]);

      const matchs = await resMatchs.json();
      const players = await resPlayers.json();

      // Séparation des matchs joués et à venir
      const joues = matchs.filter(m => m.resultat && m.resultat.trim() !== '');
      const aVenir = matchs.filter(m => !m.resultat || m.resultat.trim() === '');

      const dernierMatch = joues.length > 0 ? joues[joues.length - 1] : null;
      const prochainMatch = aVenir.length > 0 ? aVenir[0] : null;

      // Anniversaires du mois en cours
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
        const dom = dernierMatch.lieu === 'Domicile' ? 'F.C. IS' : dernierMatch.adversaire;
        const ext = dernierMatch.lieu === 'Domicile' ? dernierMatch.adversaire : 'F.C. IS';
        html += `
          <div style="text-align: center;">
            <p style="margin: 5px 0; color: #666; font-size: 0.9em;">📅 ${dernierMatch.date}</p>
            <p style="font-size: 1.1em; margin: 10px 0;"><strong>${dom}</strong> vs <strong>${ext}</strong></p>
            <p style="font-size: 1.2em; font-weight: bold; color: #6b1d44;">${dernierMatch.resultat}</p>
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
        const dom = prochainMatch.lieu === 'Domicile' ? 'F.C. IS' : prochainMatch.adversaire;
        const ext = prochainMatch.lieu === 'Domicile' ? prochainMatch.adversaire : 'F.C. IS';
        html += `
          <div style="text-align: center;">
            <p style="margin: 5px 0; color: #666; font-size: 0.9em;">📅 ${prochainMatch.date}</p>
            <p style="font-size: 1.1em; margin: 10px 0;"><strong>${dom}</strong> vs <strong>${ext}</strong></p>
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
      console.error(e);
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement de l'accueil.</p>`;
    }
  }

  // --- EFFECTIF & STATS ---
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
      console.error(e);
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement des joueurs.</p>`;
    }
  }

  // --- MATCHS ---
  async function renderMatchs() {
    root.innerHTML = `<p style="text-align: center;">Chargement des matchs...</p>`;
    try {
      const res = await fetchFresh('matchs.json');
      const matchs = await res.json();

      let html = `<h2>Calendrier & Résultats</h2><div class="matchs-list">`;

      matchs.forEach(m => {
        const isPlayed = m.resultat && m.resultat.trim() !== '';
        const statusText = isPlayed ? m.resultat : 'À venir';
        const dom = m.lieu === 'Domicile' ? 'F.C. IS' : m.adversaire;
        const ext = m.lieu === 'Domicile' ? m.adversaire : 'F.C. IS';

        html += `
          <div class="match-card" style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px; font-size: 0.85em; color: #666;">
              <span>📅 ${m.date || ''}</span>
              <span style="font-weight: bold; color: ${isPlayed ? '#6b1d44' : '#d4af37'};">${statusText}</span>
            </div>
            <div style="font-size: 1.05em; text-align: center; margin: 8px 0;">
              <strong>${dom}</strong> vs <strong>${ext}</strong>
            </div>
        `;

        if (isPlayed) {
          if (m.buteurs && m.buteurs.trim() !== '') {
            html += `<div style="font-size: 0.85em; color: #444; margin-top: 5px;">⚽ <strong>Buteurs :</strong> ${m.buteurs}</div>`;
          }
          if (m.passeurs && m.passeurs.trim() !== '') {
            html += `<div style="font-size: 0.85em; color: #444; margin-top: 3px;">👟 <strong>Passeurs :</strong> ${m.passeurs}</div>`;
          }
        }

        html += `</div>`;
      });

      html += `</div>`;
      root.innerHTML = html;
    } catch (e) {
      console.error(e);
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement des matchs.</p>`;
    }
  }

  // --- ROUTEUR SIMPLE ---
  function navigateTo(hash) {
    navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`nav a[href="${hash}"]`);
    if (activeLink) activeLink.classList.add('active');

    switch (hash) {
      case '#effectif':
        renderEffectif();
        break;
      case '#matchs':
        renderMatchs();
        break;
      case '#accueil':
      default:
        renderAccueil();
        break;
    }
  }

  window.addEventListener('hashchange', () => {
    navigateTo(window.location.hash);
  });

  // Chargement initial
  navigateTo(window.location.hash || '#accueil');
});
