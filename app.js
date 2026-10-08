// --- PAGE D'ACCUEIL ---
  async function renderHome() {
    let bdaysHTML = '<div style="padding: 15px; text-align:center; color:#666;">Aucun anniversaire ce mois-ci 🎉</div>';
    let lastMatchHTML = '<div style="padding: 15px; text-align:center; color:#666;">Aucun résultat récent</div>';
    let nextMatchHTML = '<div style="padding: 15px; text-align:center; color:#666;">Aucun match à venir</div>';

    const [players, dirigeants, arbitres, matches] = await Promise.all([
      loadJson('players.json'),
      loadJson('dirigeants.json'),
      loadJson('arbitres.json'),
      loadJson('matchs.json')
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

        // --- GESTION HOMME DU MATCH (Remplace le rond bleu) ---
        const lienFormulaireHommeDuMatch = "https://forms.gle/D9fezdJibtLDauCR7";
        
        const dateMatchObj = new Date('2026-10-03T17:00:00'); 
        const mercrediSuivant23h = new Date(dateMatchObj);
        mercrediSuivant23h.setDate(dateMatchObj.getDate() + (3 + 7 - dateMatchObj.getDay()) % 7);
        mercrediSuivant23h.setHours(23, 0, 0, 0);

        const maintenant = new Date();
        const afficherResultats = maintenant >= mercrediSuivant23h;

        let hommeDuMatchHTML = `
          <div style="text-align: center; margin-top: 15px;">
            <a href="${lienFormulaireHommeDuMatch}" target="_blank" style="background: var(--primary-color, #5c1d43); color: white; padding: 8px 14px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: var(--shadow); font-size: 0.9em;">
              🌟 Élire l'homme du match ↗
            </a>
          </div>
        `;

        if (afficherResultats) {
          hommeDuMatchHTML += `
            <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid var(--primary-color, #5c1d43); text-align: center;">
              <span style="font-size: 0.8em; color: #666; display: block; margin-bottom: 2px;">🏆 Homme du match élu :</span>
              <strong style="color: var(--primary-color, #5c1d43); font-size: 0.95em;" id="nom-homme-du-match">Chargement...</strong>
            </div>
          `;

          setTimeout(() => {
            window.handleHommeDuMatchResponse = function(data) {
              const spanGagnant = document.getElementById('nom-homme-du-match');
              if (spanGagnant) {
                spanGagnant.textContent = data.gagnant || "Aucun vote";
              }
            };

            const scriptHomduMatch = document.createElement('script');
            scriptHomduMatch.src = 'https://script.google.com/macros/s/AKfycbw9qMtR8q9-IPevfSSjJrkNTHTryL8swQ2VUvPnkRgO74t3_lxudlMB_L0_FexRYMsh/exec?callback=handleHommeDuMatchResponse';
            scriptHomduMatch.onerror = function() {
              const spanGagnant = document.getElementById('nom-homme-du-match');
              if (spanGagnant) {
                spanGagnant.textContent = "Erreur de chargement";
              }
            };
            document.body.appendChild(scriptHomduMatch);
          }, 100);
        }
        // -----------------------------------------------------

        lastMatchHTML = `
          <div style="text-align: center;">
            <div style="color: #666; font-size: 0.9em; margin-bottom: 4px;">📅 ${dateVal} - ${lieuVal}</div>
            <div style="font-size: 1.15em; font-weight: bold; margin-bottom: 6px;">vs ${adversaireVal}</div>
            <div style="font-size: 1.05em; margin-bottom: 6px;">Score : ${formatScoreColor(resultatVal)}</div>
            ${detailsHTML}
            ${hommeDuMatchHTML}
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
