function initializeHub(options) {
    let allGamesData = [];
    let currentFilter = 'All';
    let currentSearchTerm = '';

    const {
        jsonPath,
        genreFilterId,
        searchInputId,
        gridId,
        titleId,
        descriptionId
    } = options;

    function loadGames() {
        fetch(jsonPath)
            .then(response => response.json())
            .then(data => {
                allGamesData = data.games;

                document.getElementById(titleId).textContent = data.title;
                document.getElementById(descriptionId).textContent = data.description;

                populateCategoriesDropdown(allGamesData);
                renderGames();
            })
            .catch(error => {
                console.error('Error loading data:', error);
                document.getElementById(descriptionId).textContent = "Failed to load data. Please try again later.";
            });
    }

    function populateCategoriesDropdown(games) {
        const genreDropdown = document.getElementById(genreFilterId);
        genreDropdown.innerHTML = '<option value="All">All Categories</option>';

        const genres = new Set();
        games.forEach(game => {
            if (game.genre) genres.add(game.genre);
        });

        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreDropdown.appendChild(option);
        });

        genreDropdown.addEventListener('change', (event) => {
            currentFilter = event.target.value;
            renderGames();
        });
    }

    function renderGames() {
        const gamesGrid = document.getElementById(gridId);
        gamesGrid.innerHTML = '';

        let filteredGames = allGamesData;

        if (currentFilter !== 'All') {
            filteredGames = filteredGames.filter(game => game.genre === currentFilter);
        }

        if (currentSearchTerm) {
            const searchTermLower = currentSearchTerm.toLowerCase();
            filteredGames = filteredGames.filter(game =>
                game.title.toLowerCase().includes(searchTermLower) ||
                (game.description && game.description.toLowerCase().includes(searchTermLower)) ||
                (game.genre && game.genre.toLowerCase().includes(searchTermLower))
            );
        }

        if (filteredGames.length === 0) {
            gamesGrid.innerHTML = '<p style="color: #a0a8ff; text-align: center; width: 100%; margin-top: 50px;">No items found matching your criteria.</p>';
            return;
        }

        filteredGames.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = `
                <div class="game-image" style="background-image: url('${game.imageUrl}')"></div>
                <div class="game-info">
                    <h3 class="game-title">${game.title}</h3>
                    <div class="game-meta">
                        <span class="game-genre">${game.genre}</span>
                        <span class="game-rating">${'★'.repeat(Math.floor(game.rating))}${'☆'.repeat(5 - Math.floor(game.rating))}</span>
                    </div>
                    <button class="play-btn" onclick="window.location.href='${game.url}'">
                        <i class="fas fa-play"></i> Play Now
                    </button>
                </div>
            `;
            gamesGrid.appendChild(gameCard);
        });
    }

    document.getElementById(searchInputId).addEventListener('input', (event) => {
        currentSearchTerm = event.target.value;
        renderGames();
    });

    loadGames();
}