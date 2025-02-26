window.Telegram.WebApp.ready();
const username = window.Telegram.WebApp.initDataUnsafe.user.username;

const clickButton = document.getElementById('clickButton');
const openCaseButton = document.getElementById('openCase');
const claimBonusButton = document.getElementById('claimBonus');
const profileButton = document.getElementById('profile');
const lvltopButton = document.getElementById('lvltop');
const casetopButton = document.getElementById('casetop');
const clanTopButton = document.getElementById('clanTop');
const clanButton = document.getElementById('clan');
const titlesButton = document.getElementById('titles');
const adminButton = document.getElementById('admin');
const balanceDisplay = document.getElementById('balance');
const levelDisplay = document.getElementById('level');
const xpDisplay = document.getElementById('xp');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.getElementsByClassName('close')[0];

let balance = 0;
let level = 1;
let xp = 0;
let nextLevelXp = 500;

function updateDisplay() {
    balanceDisplay.textContent = `💰 ${balance} ₽`;
    levelDisplay.textContent = `⭐ Уровень: ${level}`;
    xpDisplay.textContent = `📈 Опыт: ${xp}/${nextLevelXp}`;
}

function showModal(content) {
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}

closeModal.onclick = () => modal.style.display = 'none';
window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };

fetch(`/profile?username=${username}`).then(r => r.json()).then(data => {
    balance = data.balance;
    level = data.level;
    xp = data.xp;
    nextLevelXp = get_level_xp(level + 1);
    updateDisplay();
});

clickButton.addEventListener('click', () => {
    fetch('/click', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username}) })
        .then(r => r.json())
        .then(data => { balance = data.balance; updateDisplay(); });
});

openCaseButton.addEventListener('click', () => {
    fetch('/open_case', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username}) })
        .then(r => r.json())
        .then(data => {
            if (data.error) return alert(data.error);
            balance = data.balance;
            level = data.level;
            xp = data.total_xp;
            nextLevelXp = get_level_xp(level + 1);
            updateDisplay();
            showModal(`@{username}, ты вскрыл ${is_superuser() ? 5 : 1} кейсов! Вот твой улов:<br>` + 
                data.titles_won.map(t => `🎁 ${t.title} (+${t.xp * (is_superuser() ? 2 : 1)} XP, шанс: ${t.chance.toFixed(5)}%)`).join('<br>') + 
                `<br><br>📈 Опыт за кейсы: ${data.case_xp} XP<br>📚 Всего опыта: ${data.total_xp}` +
                (data.level_up_msg ? `<br><br>${data.level_up_msg}` : ''));
        });
});

claimBonusButton.addEventListener('click', () => {
    fetch('/claim_bonus', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username}) })
        .then(r => r.json())
        .then(data => {
            if (data.error) return alert(data.error);
            balance = data.balance;
            updateDisplay();
            showModal(data.message);
        });
});

profileButton.addEventListener('click', () => {
    fetch(`/profile?username=${username}`).then(r => r.json()).then(data => {
        showModal(`👤 Профиль @${username} — легенда в деле!<br>` +
            `💰 Баланс: ${data.balance}₽ (ты богач или ещё нет?)<br>` +
            `📦 Кейсов открыто: ${data.cases_opened} (мастер вскрытия!)<br>` +
            `🏆 Лучший титул: ${data.best_title} (круто звучит, а?)<br>` +
            `⭐ Уровень: ${data.level} (расти дальше!)<br>` +
            `📈 Опыт: ${data.xp_bar}<br>` +
            `🏰 Clan: ${data.clan}` +
            (data.superuser ? `<br>🎖️ SuperUser: x2 опыта, x5 кликов и кейсов! Ты избранный! ⚡` : ''));
    });
});

lvltopButton.addEventListener('click', () => {
    fetch('/lvltop').then(r => r.json()).then(data => showModal(data.top));
});

casetopButton.addEventListener('click', () => {
    fetch('/casetop').then(r => r.json()).then(data => showModal(data.top));
});

clanTopButton.addEventListener('click', () => {
    fetch('/clan_top').then(r => r.json()).then(data => showModal(data.top));
});

clanButton.addEventListener('click', () => {
    fetch(`/clan?username=${username}`).then(r => r.json()).then(data => {
        let content = `🏰 Добро пожаловать в мир кланов, воин! ⚔️<br>` +
            `Твой клан: ${data.clan ? data.clan : 'Нет клана'}<br>` +
            `Баланс: ${data.balance}₽<br><br>` +
            `<input id="clanName" placeholder="Название клана"><br>` +
            `<button onclick="createClan()">🏰 Создать клан (50000₽)</button>` +
            `<button onclick="joinClan()">🤝 Вступить в клан</button><br><br>`;
        
        if (data.clan && data.is_leader) {
            content += `👥 Твоя братва в клане ${data.clan}:<br>` +
                data.members.map(m => `@{m.username} — ${m.cases} 📦`).join('<br>') +
                `<br><br><input id="targetMember" placeholder="Кого кикнуть/пригласить (@username)"><br>` +
                `<button onclick="kickMember('${data.clan}')">⚔️ Кикнуть бойца</button>` +
                `<button onclick="inviteMember('${data.clan}')">📩 Пригласить в клан</button><br>`;
        }
        
        content += `<br>📬 Твоя клановая почта, @${username}!<br>`;
        if (data.invites.length) {
            content += "✨ Приглашения в кланы:<br>" + 
                data.invites.map(i => `${i.clan_name} (ID: ${i.id}) — зовут в банду! 🤝 ` +
                    `<button onclick="acceptInvite(${i.id})">✅ Вступить</button>` +
                    `<button onclick="declineRequest(${i.id})">❌ Отказаться</button>`).join('<br>');
        }
        if (data.requests.length) {
            content += "<br>📩 Заявки в твой клан:<br>" + 
                data.requests.map(r => `@{r.username} (${r.type == 'join' ? 'хочет вступить' : 'ты звал'}, ID: ${r.id}) ` +
                    `<button onclick="acceptRequest(${r.id})">✅ Принять</button>` +
                    `<button onclick="declineRequest(${r.id})">❌ Отказать</button>`).join('<br>');
        }
        if (!data.invites.length && !data.requests.length) {
            content += "Тишина в эфире, братан! Ни писем, ни гостей! 📭";
        }
        
        content += `<br><br>🏰 Все кланы:<br>` + 
            data.clans.map(c => `${c.name} (Лидер: @${c.leader}, Кейсы: ${c.cases})`).join('<br>');
        
        showModal(content);
    });
});

titlesButton.addEventListener('click', () => {
    fetch('/all_titles').then(r => r.json()).then(data => showModal(data.titles));
});

adminButton.addEventListener('click', () => {
    let content = `⚡ Админ-панель для @${username}<br>` +
        `<input id="targetUser" placeholder="Имя юзера (@username)"><br>` +
        `<input id="amount" type="number" placeholder="Сумма"><br>` +
        `<button onclick="setSuperuser()">⚡ Дать SuperUser</button>` +
        `<button onclick="delSuperuser()">❌ Убрать SuperUser</button>` +
        `<button onclick="setBalance()">💼 Установить баланс</button>`;
    showModal(content);
});

function createClan() {
    const clanName = document.getElementById('clanName').value;
    fetch('/clan', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, action: 'create', clan_name: clanName}) })
        .then(r => r.json())
        .then(data => data.error ? alert(data.error) : showModal(data.message));
}

function joinClan() {
    const clanName = document.getElementById('clanName').value;
    fetch('/clan', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, action: 'join', clan_name: clanName}) })
        .then(r => r.json())
        .then(data => data.error ? alert(data.error) : showModal(data.message));
}

function kickMember(clanName) {
    const target = document.getElementById('targetMember').value.replace('@', '');
    fetch('/clan', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, action: 'kick', clan_name: clanName, target}) })
        .then(r => r.json())
        .then(data => data.error ? alert(data.error) : showModal(data.message));
}

function inviteMember(clanName) {
    const target = document.getElementById('targetMember').value.replace('@', '');
    fetch('/clan', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, action: 'invite', clan_name: clanName, target}) })
        .then(r => r.json())
        .then(data => data.error ? alert(data.error) : showModal(data.message));
}

function acceptInvite(reqId) {
    fetch('/clan', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, action: 'accept_invite', req_id: reqId}) })
        .then(r => r.json())
        .then(data => data.error ? alert(data.error) : showModal(data.message));
}

function acceptRequest(reqId) {
    fetch('/clan', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, action: 'accept_request', req_id: reqId}) })
        .then(r => r.json())
        .then(data => data.error ? alert(data.error) : showModal(data.message));
}

function declineRequest(reqId) {
    fetch('/clan', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, action: 'decline', req_id: reqId}) })
        .then(r => r.json())
        .then(data => data.error ? alert(data.error) : showModal(data.message));
}

function setSuperuser() {
    const target = document.getElementById('targetUser').value.replace('@', '');
    fetch('/superuser', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, target}) })
        .then(r => r.json())
        .then(data => data.error ? alert(data.error) : showModal(data.message));
}

function delSuperuser() {
    const target = document.getElementById('targetUser').value.replace('@', '');
    fetch('/delsuperuser', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, target}) })
        .then(r => r.json())
        .then(data => data.error ? alert(data.error) : showModal(data.message));
}

function setBalance() {
    const target = document.getElementById('targetUser').value.replace('@', '');
    const amount = parseInt(document.getElementById('amount').value);
    fetch('/setbalance', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, target, amount}) })
        .then(r => r.json())
        .then(data => data.error ? alert(data.error) : showModal(data.message));
}

function is_superuser() {
    return fetch(`/profile?username=${username}`).then(r => r.json()).then(data => data.superuser);
}

function get_level_xp(level) {
    return Math.floor(500 * level * (1 + level ** 1.5 / 100));
}