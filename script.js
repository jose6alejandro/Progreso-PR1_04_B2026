
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1rsQeXX8Xny1xO_LTXLGnqynjwQZTlbWChHHsfqUXYVc/edit?usp=sharing';
const SHEET_ID = SHEET_URL.match(/\/spreadsheets\/d\/([^/]+)/)?.[1] || SHEET_URL;
const SHEET_GID = '';
const DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv${SHEET_GID ? `&gid=${SHEET_GID}` : ''}`;

const gameData = {
    level: "",
    totalPointsPossible: 3000,
    players: [] 
};

function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim());
    const headers = parseCSVLine(lines[0]).map(header => header.trim().toLowerCase());
    const column = name => headers.indexOf(name);
    const levelIndex = column('level');
    const descriptionIndex = column('description');
    const playerColumns = ['id', 'name', 'progress', 'score', 'lives', 'type'];
    const players = [];

    for (let i = 1; i < lines.length; i++) {
        const currentline = parseCSVLine(lines[i]);
        const hasPlayerData = playerColumns.every(name => {
            const index = column(name);
            return index >= 0 && currentline[index] !== undefined;
        });

        if (hasPlayerData) {
            const player = {
                id: parseInt(currentline[column('id')]),
                name: currentline[column('name')].trim(),
                progress: parseInt(currentline[column('progress')]),
                score: parseInt(currentline[column('score')]),
                lives: parseInt(currentline[column('lives')]),
                type: currentline[column('type')].trim()
            };
            players.push(player);
        }
    }
    return {
        level: levelIndex >= 0 ? currentlineValue(lines[1], levelIndex) : '',
        description: descriptionIndex >= 0 ? currentlineValue(lines[1], descriptionIndex) : '',
        players
    };
}

function currentlineValue(line, index) {
    return parseCSVLine(line)[index]?.trim() || '';
}

function parseCSVLine(line) {
    const values = [];
    const fieldPattern = /("(?:[^"]|"")*"|[^,]*)(?:,|$)/g;
    let match;

    while ((match = fieldPattern.exec(line)) !== null) {
        if (match[0] === '') break;

        const value = match[1].trim();
        values.push(value.startsWith('"') && value.endsWith('"')
            ? value.slice(1, -1).replace(/""/g, '"')
            : value);
    }

    return values;
}

function updatePageTitle(level) {
    const levelText = (level || '').trim();
    gameData.level = levelText
        ? (/^nivel\b/i.test(levelText) ? levelText : `Nivel ${levelText}`)
        : 'Sin nivel';
    const title = `PR1 - Progreso (${gameData.level})`;
    document.title = title;
    document.querySelector('header h1').textContent = title;
}

function updateLevelDescription(level, description) {
    const levelCode = gameData.level.match(/\d+/)?.[0];
    const code = levelCode ? `LVL-${levelCode.padStart(2, '0')}` : 'LVL-??';
    const descriptionElement = document.getElementById('level-story');
    const codeElement = document.getElementById('description-level');

    if (codeElement) codeElement.textContent = code;
    if (descriptionElement && description.trim()) {
        descriptionElement.textContent = description.trim();
    }
}

async function loadPlayerData() {
    try {
        const response = await fetch(DATA_URL, { cache: 'no-store' });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        const parsedData = parseCSV(csvText);
        updatePageTitle(parsedData.level);
        updateLevelDescription(parsedData.level, parsedData.description);
        gameData.players = parsedData.players;
        gameData.players.sort((a, b) => b.score - a.score);
        renderPlayerList(gameData);
        
    } catch (error) {
        console.error("Error al cargar los datos de los jugadores:", error);
        document.getElementById('player-list').innerHTML = '<li class="player-row">Error de lectura.</li>';
    }
}

function syncResultsHeight() {
    const results = document.getElementById('player-results');
    const mapColumn = document.getElementById('map-column');

    if (!results || !mapColumn) return;

    if (window.matchMedia('(max-width: 900px)').matches) {
        results.style.height = '';
        return;
    }

    results.style.height = `${mapColumn.offsetHeight}px`;
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
        name.textContent = `${player.name} - ${player.progress}% completado`;
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
            const progress = Math.max(0, Math.min(100, Number(player.progress) || 0));
            progressBar.style.width = `${progress}%`;
        }, 100 + (index * 50)); 
    });
}

window.onload = function() {
    loadPlayerData(); 
    setInterval(loadPlayerData, 30000);
    syncResultsHeight();
    new ResizeObserver(syncResultsHeight).observe(document.getElementById('map-column'));
    window.addEventListener('resize', syncResultsHeight);
};