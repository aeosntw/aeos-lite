const sidebarData = {
    logoIcon: "https://iili.io/3WehREl.png",
    logoFull: "/img/logos/Aeos Header Logo.png",
    items: [{
            title: "Home",
            icon: "fa-home",
            url: "/index.html"
        },
        {
            title: "Games",
            icon: "fa-gamepad",
            url: "/gms.html"
        },
        {
            title: "Apps",
            icon: "fa-grid",
            url: "/ap.html"
        }
    ],
    version: "Aeos v0.9"
};

function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');

    sidebar.appendChild(document.createElement('div')).className = 'spacer';

    const navItemsContainer = document.createElement('div');
    navItemsContainer.className = 'nav-items-container';

    sidebarData.items.forEach(item => {
        const navItem = document.createElement('a');
        navItem.className = 'nav-item';
        navItem.href = item.url;
        navItem.innerHTML = `
            <i class="fas ${item.icon} nav-icon"></i>
            <span class="nav-text">${item.title}</span>
        `;
        navItemsContainer.appendChild(navItem);
    });

    sidebar.appendChild(navItemsContainer);
    sidebar.appendChild(document.createElement('div')).className = 'spacer';

    const batteryDiv = document.createElement('div');
    batteryDiv.id = 'battery-status';
    batteryDiv.className = 'battery-status';
    batteryDiv.innerHTML = `
    <span id="battery-icon"></span>
    <span id="battery-full-text"> Battery: ...</span>
`;
    sidebar.appendChild(batteryDiv);

    const countdownDiv = document.createElement('div');
    countdownDiv.className = 'countdown-timer';

    countdownDiv.style.display = 'flex';
    countdownDiv.style.flexDirection = 'column';
    countdownDiv.style.alignItems = 'center';
    countdownDiv.innerHTML = `
        <i class="fas fa-clock nav-icon" style="display: block; margin: 0 auto;"></i>
        <span id="countdown-main-text" class="countdown-display-text"></span>
        <span id="countdown-secondary-text" class="countdown-secondary-text">Until school ends</span>
    `;
    sidebar.appendChild(countdownDiv);

    const versionNumber = document.createElement('div');
    versionNumber.className = 'version-number';
    versionNumber.innerHTML = `
        <i class="fas fa-code-branch nav-icon"></i>
        <span class="nav-text">${sidebarData.version}</span>
    `;
    sidebar.appendChild(versionNumber);
}

function setupBatteryIndicator() {

    if (!navigator.getBattery) {
        const batteryDiv = document.getElementById('battery-status');
        if (batteryDiv) {
            batteryDiv.style.display = 'none';
        }
        console.warn("Battery Status API not supported on this browser.");
        return;
    }

    navigator.getBattery().then(function(battery) {

        const iconSpan = document.getElementById('battery-icon');
        const fullText = document.getElementById('battery-full-text');

        function getIcon(level) {

            if (level > 0.9) return '萩';
            if (level > 0.6) return '泙';
            if (level > 0.3) return '泯';
            if (level > 0.1) return '閥';
            return 'ｪｫ';
        }

        function updateBattery() {
            const level = Math.round(battery.level * 100);
            const charging = battery.charging ? '笞｡' : '';
            const icon = getIcon(battery.level);

            if (iconSpan) iconSpan.textContent = `${icon}${charging}`;
            if (fullText) fullText.textContent = ` Battery: ${level}% ${charging}`;
        }

        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
    }).catch(error => {
        console.error("Error accessing Battery Status API: ", error);
        const batteryDiv = document.getElementById('battery-status');
        if (batteryDiv) {
            batteryDiv.style.display = 'none';
        }
    });
}

let countdownIntervalId;

function updateCountdownDisplay() {
    const countdownMainText = document.getElementById('countdown-main-text');
    const countdownSecondaryText = document.getElementById('countdown-secondary-text');
    const sidebar = document.getElementById('sidebar');
    const targetDate = new Date('2025-06-11T11:35:00').getTime();

    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        countdownMainText.textContent = "Have fun!";

        countdownSecondaryText.style.opacity = '0';
        countdownSecondaryText.style.visibility = 'hidden';
        clearInterval(countdownIntervalId);
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const isCollapsed = sidebar.classList.contains('collapsed');

    let mainDisplayText = '';

    if (isCollapsed) {

        if (days > 0) {
            mainDisplayText = `${days}d ${hours}h`;
        } else if (hours > 0) {
            mainDisplayText = `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            mainDisplayText = `${minutes}m ${seconds}s`;
        } else {
            mainDisplayText = `${seconds}s`;
        }

        countdownSecondaryText.style.opacity = '0';
        countdownSecondaryText.style.visibility = 'hidden';
    } else {

        mainDisplayText = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        countdownSecondaryText.style.opacity = '1';
        countdownSecondaryText.style.visibility = 'visible';
    }

    countdownMainText.textContent = mainDisplayText;
}

function setupCountdown() {

    if (countdownIntervalId) {
        clearInterval(countdownIntervalId);
    }

    countdownIntervalId = setInterval(updateCountdownDisplay, 1000);

    updateCountdownDisplay();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
    setupBatteryIndicator();

    const sidebar = document.getElementById('sidebar');

    sidebar.classList.add('collapsed');

    setupCountdown();

    sidebar.addEventListener('mouseenter', () => {
        sidebar.classList.remove('collapsed');

        updateCountdownDisplay();
    });

    sidebar.addEventListener('mouseleave', () => {
        sidebar.classList.add('collapsed');

        updateCountdownDisplay();
    });
});