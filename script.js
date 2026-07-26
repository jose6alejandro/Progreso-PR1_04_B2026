// --- DATOS DE JUEGO Y LÓGICA (JS) ---

const gameData = {
    level: "Nivel 1",
    totalPointsPossible: 3000,
    players: [] 
};

function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    const players = [];

    for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i].split(',');
        if (currentline.length === headers.length) {
            const player = {
                id: parseInt(currentline[0]),
                name: currentline[1],
                progress: parseInt(currentline[2]),
                score: parseInt(currentline[3]),
                lives: parseInt(currentline[4]),
                type: currentline[5].trim() 
            };
            players.push(player);
        }
    }
    return players;
}

async function loadPlayerData() {
    try {
        const response = await fetch('data.csv');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        gameData.players = parseCSV(csvText);
        gameData.players.sort((a, b) => b.score - a.score);
        renderPlayerList(gameData);
        
    } catch (error) {
        console.error("Error al cargar los datos de los jugadores:", error);
        document.getElementById('player-list').innerHTML = '<li class="player-row">Error de lectura.</li>';
    }
}

function renderPlayerList(data) {
    const listElement = document.getElementById('player-list');
    listElement.innerHTML = ''; 

    data.players.forEach((player, index) => { 
        
        const row = document.createElement('li');
        row.className = 'player-row';

        if (index === 0) row.classList.add('rank-1');
        if (index === 1) row.classList.add('rank-2');
        if (index === 2) row.classList.add('rank-3');

        const avatar = document.createElement('div');
        avatar.className = 'player-avatar';
        avatar.textContent = index + 1;
        row.appendChild(avatar);

        const info = document.createElement('div');
        info.className = 'player-info';

        const name = document.createElement('h3');
        name.className = 'player-name';
        name.textContent = `${player.name} - ${player.progress}% Complete`;
        info.appendChild(name);

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        const progressBar = document.createElement('div');
        const barType = player.type === 'orange' ? 'progress-orange' : 'progress-green';
        progressBar.className = `progress-bar ${barType}`;
        progressContainer.appendChild(progressBar);
        info.appendChild(progressContainer);

        row.appendChild(info);

        const stats = document.createElement('div');
        stats.className = 'player-stats';

        const score = document.createElement('p');
        score.className = 'player-score';
        score.textContent = `XP: ${player.score.toLocaleString()}`;
        stats.appendChild(score);

        const lives = document.createElement('div');
        lives.className = 'player-lives';
        let heartHTML = '';
        for (let i = 0; i < player.lives; i++) {
            // heartHTML += '<span class="heart-icon"> 🎖️ </span>';
        }
        lives.innerHTML = heartHTML;
        stats.appendChild(lives);

        row.appendChild(stats);
        listElement.appendChild(row);

        setTimeout(() => {
            progressBar.style.width = `${player.progress}%`;
        }, 100 + (index * 50)); 
    });
}

window.onload = function() {
    document.querySelector('header h1').textContent = ` PR1 - Progreso (${gameData.level})`;
    loadPlayerData(); 
};