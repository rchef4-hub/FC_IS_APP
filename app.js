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
      const [resMatchs, resPlayers, resDirigeants, resArbitres] = await Promise.all([
        fetchFresh('matchs.json').catch(() => ({ json: () => [] })),
        fetchFresh('players.json').catch(() => ({ json: () => [] })),
        fetchFresh('dirigeants.json').catch(() => ({ json: () => [] })),
        fetchFresh('arbitres.json').catch(() => ({ json: () => [] }))
      ]);

      const matchs = await resMatchs.json();
      const players = await resPlayers.json();
      const dirigeants = await resDirigeants.json();
      const arbitres = await resArbitres.json();

      // On regroupe tout le monde dans une seule liste générale
      const tousLesMembres = [...players, ...dirigeants, ...arbitres];

      const joues = matchs.filter(m => m.resultat && m.resultat.trim() !== '');
      const aVenir = matchs.filter(m => !m.resultat || m.resultat.trim() === '');

      const dernierMatch = joues.length > 0 ? joues[joues.length - 1] : null;
      const prochainMatch = aVenir.length > 0 ? aVenir[0] : null;

      const moisActuel = (new Date().getMonth() + 1).toString().padStart(2, '0');
      
      // Filtrage et TRI des anniversaires par ordre chronologique
      const anniversaires = tousLesMembres.filter(p => {
        if (!p.naissance) return false;
        const parts = p.naissance.trim().split('/');
        return parts.length === 3 && parts[1] === moisActuel;
      }).sort((a, b) => {
        const jourA = parseInt(a.naissance.split('/')[0], 10);
        const jourB = parseInt(b.naissance.split('/')[0], 10);
        return jourA - jourB; // Du 1er jusqu'à la fin du mois
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
          const jourMois = p.naissance ? p.naissance.substring(0, 5) : '';
          let fullName = '';
          if (p.prenom && p.nom) {
            fullName = `${p.prenom.trim()} ${p.nom.trim()}`;
          } else {
            fullName = p.nom || p.prenom || p.name || 'Membre';
          }

          html += `
            <div style="display: flex; justify-content: space-between; background: #f9f9f9; padding: 8px 12px; margin-bottom: 6px; border-radius: 5px; border-left: 4px solid #d4af37;">
              <span>🎂 <strong>${fullName.toUpperCase()}</strong></span>
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
      console.error(e);
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

  // --- PAGE EFFECTIF (#players) AVEC TROIS FICHIERS SÉPARÉS ---
  async function renderEffectif() {
    root.innerHTML = `<p style="text-align: center;">Chargement de l'effectif...</p>`;
    try {
      const [resPlayers, resDirigeants, resArbitres] = await Promise.all([
        fetchFresh('players.json').catch(() => ({ json: () => [] })),
        fetchFresh('dirigeants.json').catch(() => ({ json: () => [] })),
        fetchFresh('arbitres.json').catch(() => ({ json: () => [] }))
      ]);

      const joueurs = await resPlayers.json();
      const dirigeants = await resDirigeants.json();
      const arbitres = await resArbitres.json();

      let html = `
        <h2 style="color: #6b1d44; text-align: center; margin-bottom: 15px;">Effectif du Club</h2>
        <div style="display: flex; flex-direction: column; gap: 10px;">
      `;

      function renderCategorySection(title, icon, items, id) {
        if (!items || items.length === 0) return '';
        return `
          <div class="accordion-container">
            <button class="accordion-header" data-target="${id}" style="width: 100%; background: #6b1d44; color: white; border: none; padding: 12px 15px; border-radius: 8px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 1em;">
              <span>${icon} ${title}</span>
              <span>▼</span>
            </button>
            <div id="${id}" style="display: none; background: #fff; padding: 10px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: -2px; flex-direction: column; gap: 8px;">
              ${items.map(p => {
                let fullName = '';
                if (p.prenom && p.nom) {
                  fullName = `${p.prenom.trim()} ${p.nom.trim()}`;
                } else {
                  fullName = p.nom || p.prenom || p.name || 'Nom inconnu';
                }

                return `
                  <div style="background: #fafafa; border-radius: 6px; padding: 10px 12px; display: flex; align-items: center; border-left: 4px solid #d4af37;">
                    <div>
                      <strong style="font-size: 1em; color: #222;">${fullName}</strong>
                      <div style="font-size: 0.85em; color: #666; margin-top: 2px;">${p.poste || p.role || title.slice(0, -1)}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      html += renderCategorySection('Joueurs', '⚽', joueurs, 'content-joueurs');
      html += renderCategorySection('Dirigeants', '👔', dirigeants, 'content-dirigeants');
      html += renderCategorySection('Arbitres', '⬜🟨🟥', arbitres, 'content-arbitres');

      html += `</div>`;
      root.innerHTML = html;

      root.querySelectorAll('.accordion-header').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const content = document.getElementById(targetId);
          const arrow = btn.querySelector('span:last-child');

          if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'flex';
            arrow.textContent = '▲';
            btn.style.borderRadius = '8px 8px 0 0';
          } else {
            content.style.display = 'none';
            arrow.textContent = '▼';
            btn.style.borderRadius = '8px';
          }
        });
      });

    } catch (e) {
      console.error(e);
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement de l'effectif.</p>`;
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
      let victoires = 0, nuls = 0, defaites = 0;

      joues.forEach(m => {
        const res = m.resultat.toLowerCase();
        if (res.includes('victoire')) victoires++;
        else if (res.includes('nul')) nuls++;
        else if (res.includes('défaite') || res.includes('defaite')) defaites++;
      });

      const classementMatchs = [...players].sort((a, b) => (b.matchs || 0) - (a.matchs || 0));
      const topButeurs = [...players].filter(p => (p.buts || 0) > 0).sort((a, b) => (b.buts || 0) - (a.buts || 0));
      const topPasseurs = [...players].filter(p => (p.passes || 0) > 0).sort((a, b) => (b.passes || 0) - (a.passes || 0));

      let html = `
        <h2 style="color: #6b1d44; text-align: center; margin-bottom: 15px;">Statistiques de la Saison</h2>

        <div class="card" style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
          <div style="background: #6b1d44; color: white; text-align: center; padding: 8px; border-radius: 6px; font-weight: bold; margin-bottom: 12px;">
            📊 Bilan Global (${joues.length} matchs joués)
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

        <div style="display: flex; flex-direction: column; gap: 10px;">

          <div class="accordion-container">
            <button class="accordion-header" data-target="content-buteurs" style="width: 100%; background: #6b1d44; color: white; border: none; padding: 12px 15px; border-radius: 8px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 1em;">
              <span>⚽ Meilleurs Buteurs</span>
              <span>▼</span>
            </button>
            <div id="content-buteurs" style="display: none; background: white; padding: 10px 15px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: -2px;">
              ${topButeurs.length > 0 ? topButeurs.map((p, index) => `
                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f1f1; font-size: 0.95em;">
                  <span>${index + 1}. <strong>${p.nom}</strong></span>
                  <span style="color: #2e7d32; font-weight: bold;">${p.buts} buts</span>
                </div>
              `).join('') : '<p style="text-align: center; color: #666; font-size: 0.9em; padding: 5px 0;">Aucun but enregistré pour le moment</p>'}
            </div>
          </div>

          <div class="accordion-container">
            <button class="accordion-header" data-target="content-passeurs" style="width: 100%; background: #6b1d44; color: white; border: none; padding: 12px 15px; border-radius: 8px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 1em;">
              <span>👟 Meilleurs Passeurs</span>
              <span>▼</span>
            </button>
            <div id="content-passeurs" style="display: none; background: white; padding: 10px 15px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: -2px;">
              ${topPasseurs.length > 0 ? topPasseurs.map((p, index) => `
                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f1f1; font-size: 0.95em;">
                  <span>${index + 1}. <strong>${p.nom}</strong></span>
                  <span style="color: #00838f; font-weight: bold;">${p.passes} passes</span>
                </div>
              `).join('') : '<p style="text-align: center; color: #666; font-size: 0.9em; padding: 5px 0;">Aucune passe décisive enregistrée pour le moment</p>'}
            </div>
          </div>

          <div class="accordion-container">
            <button class="accordion-header" data-target="content-discipline" style="width: 100%; background: #6b1d44; color: white; border: none; padding: 12px 15px; border-radius: 8px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 1em;">
              <span>⬜🟨🟥 Discipline</span>
              <span>▼</span>
            </button>
            <div id="content-discipline" style="display: none; background: white; padding: 15px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: -2px; text-align: center; color: #666; font-size: 0.9em;">
              Aucune sanction enregistrée pour le moment.
            </div>
          </div>

          <div class="accordion-container">
            <button class="accordion-header" data-target="content-matchs-joueurs" style="width: 100%; background: #6b1d44; color: white; border: none; padding: 12px 15px; border-radius: 8px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 1em;">
              <span>⭐ Matchs Joués par les Joueurs</span>
              <span>▼</span>
            </button>
            <div id="content-matchs-joueurs" style="display: none; background: white; padding: 10px 15px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: -2px;">
              ${classementMatchs.map((p, index) => `
                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f1f1; font-size: 0.95em;">
                  <span>${index + 1}. <strong>${p.nom}</strong></span>
                  <span style="color: #6b1d44; font-weight: bold;">${p.matchs || 0} matchs</span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      `;

      root.innerHTML = html;

      root.querySelectorAll('.accordion-header').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const content = document.getElementById(targetId);
          const arrow = btn.querySelector('span:last-child');

          if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            arrow.textContent = '▲';
            btn.style.borderRadius = '8px 8px 0 0';
          } else {
            content.style.display = 'none';
            arrow.textContent = '▼';
            btn.style.borderRadius = '8px';
          }
        });
      });

    } catch (e) {
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement des statistiques.</p>`;
    }
  }

  // --- PAGE ANNONCES (#announcements) ---
  async function renderAnnonces() {
    root.innerHTML = `<p style="text-align: center;">Chargement des annonces...</p>`;
    try {
      let annonces = [];
      try {
        const res = await fetchFresh('annonces.json');
        annonces = await res.json();
      } catch (err) {
        annonces = [
          { titre: "Reprise des entraînements", date: "Septembre 2026", contenu: "Les entraînements ont lieu les mardi et jeudi à 19h." },
          { titre: "Assemblée générale", date: "Prochainement", contenu: "Venez nombreux participer à la vie du club." }
        ];
      }

      const couleurs = ['#6b1d44', '#2e7d32', '#00838f', '#ef6c00', '#d4af37'];

      let html = `<h2 style="color: #6b1d44; text-align: center; margin-bottom: 15px;">Annonces & Infos du Club</h2><div style="display: flex; flex-direction: column; gap: 12px;">`;

      annonces.forEach((a, index) => {
        const couleurBordure = couleurs[index % couleurs.length];
        const texteAnnonce = a.contenu || a.texte || a.description || '';

        html += `
          <div class="card" style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-left: 5px solid ${couleurBordure};">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <strong style="color: ${couleurBordure}; font-size: 1.05em;">📢 ${a.titre}</strong>
              <span style="font-size: 0.85em; color: #666;">${a.date || ''}</span>
            </div>
            <p style="font-size: 0.9em; color: #444; margin: 0;">${texteAnnonce}</p>
          </div>
        `;
      });

      html += `</div>`;
      root.innerHTML = html;
    } catch (e) {
      root.innerHTML = `<p style="color: red; text-align: center;">Erreur lors du chargement des annonces.</p>`;
    }
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
