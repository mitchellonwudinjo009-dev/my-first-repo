function generateLocalCoverDataUrl(title, color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createLinearGradient(0, 0, 200, 200);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 200, 200);
    
    ctx.fillStyle = '#00FF66';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.substring(0, 10), 100, 100);
    
    return canvas.toDataURL();
}

const DEFAULT_SONGS = [
    { id: '1', title: 'Cyber Horizon', artist: 'Neon Pulse', category: 'Pop', cover: generateLocalCoverDataUrl('Cyber', '#1a1a1a', '#003311'), audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', uploader: 'system', likedBy: ['Alice', 'Bob'], favoritesCount: 2 },
    { id: '2', title: 'Midnight Beats', artist: 'Sleek Crew', category: 'Hip-Hop', cover: generateLocalCoverDataUrl('Midnight', '#111122', '#220033'), audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', uploader: 'system', likedBy: ['David'], favoritesCount: 1 },
    { id: '3', title: 'Electric Vibe', artist: 'Aura Vibe', category: 'Afro-beat', cover: generateLocalCoverDataUrl('Electric', '#221100', '#332200'), audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', uploader: 'system', likedBy: ['Eve'], favoritesCount: 1 },
    { id: '4', title: 'Velvet Groove', artist: 'Smooth Sax', category: 'Jazz', cover: generateLocalCoverDataUrl('Velvet', '#001122', '#002233'), audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', uploader: 'system', likedBy: [], favoritesCount: 0 },
    { id: '5', title: 'Metal Thunder', artist: 'AnVIL', category: 'Rock', cover: generateLocalCoverDataUrl('Thunder', '#330000', '#111111'), audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', uploader: 'system', likedBy: ['Grace'], favoritesCount: 1 }
];

let state = {
    user: JSON.parse(localStorage.getItem('streamify_user')) || null,
    songs: JSON.parse(localStorage.getItem('streamify_songs')) || DEFAULT_SONGS,
    favorites: JSON.parse(localStorage.getItem('streamify_favorites')) || [],
    downloads: JSON.parse(localStorage.getItem('streamify_downloads')) || [],
    bin: JSON.parse(localStorage.getItem('streamify_bin')) || [],
    history: JSON.parse(localStorage.getItem('streamify_history')) || [],
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isShuffle: false,
    isRepeat: false,
    activeCategory: 'All',
    searchQuery: '',
    currentRoute: 'home'
};

function saveState() {
    localStorage.setItem('streamify_user', JSON.stringify(state.user));
    localStorage.setItem('streamify_songs', JSON.stringify(state.songs));
    localStorage.setItem('streamify_favorites', JSON.stringify(state.favorites));
    localStorage.setItem('streamify_downloads', JSON.stringify(state.downloads));
    localStorage.setItem('streamify_bin', JSON.stringify(state.bin));
    localStorage.setItem('streamify_history', JSON.stringify(state.history));
}

const router = {
    navigate: function(route) {
        state.currentRoute = route;
        renderView();
        updateSidebarActive(route);
        updatePlayerVisibility(route);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

function updateSidebarActive(route) {
    const routes = ['home', 'favorites', 'downloads', 'bin', 'history', 'library', 'upload', 'beatmaker', 'settings'];
    routes.forEach(r => {
        const btn = document.getElementById(`nav-${r}`);
        if (!btn) return;
        if (r === route) {
            btn.className = "w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-all text-streamify-green bg-streamify-card border border-streamify-green/20";
        } else {
            btn.className = "w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-all text-gray-400 hover:text-white hover:bg-streamify-card";
        }
    });
}

function updatePlayerVisibility(route) {
    const player = document.getElementById('persistentPlayer');
    if (route === 'home') {
        player.classList.remove('translate-y-full');
    } else {
        player.classList.add('translate-y-full');
    }
}

function initHoverPlayer() {
    const player = document.getElementById('persistentPlayer');
    const hoverZone = document.getElementById('playerHoverZone');
    let hideTimeout;

    function showPlayer() {
        clearTimeout(hideTimeout);
        player.classList.remove('translate-y-full');
    }

    function hidePlayer() {
        if (state.currentRoute !== 'home') {
            hideTimeout = setTimeout(() => {
                if (!player.matches(':hover')) {
                    player.classList.add('translate-y-full');
                }
            }, 400);
        }
    }

    hoverZone.addEventListener('mouseenter', showPlayer);
    hoverZone.addEventListener('mousemove', showPlayer);
    player.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    player.addEventListener('mouseleave', hidePlayer);

    document.addEventListener('mousemove', (e) => {
        if (state.currentRoute !== 'home') {
            if (window.innerHeight - e.clientY <= 40) {
                showPlayer();
            } else if (!player.matches(':hover')) {
                hidePlayer();
            }
        }
    });
}

function renderView() {
    renderAuthHeader();
    renderSidebarLibraryTab();
    const container = document.getElementById('mainViewContainer');
    if (!container) return;

    switch(state.currentRoute) {
        case 'home': container.innerHTML = renderHomeView(); break;
        case 'favorites': container.innerHTML = renderFavoritesView(); break;
        case 'downloads': container.innerHTML = renderDownloadsView(); break;
        case 'bin': container.innerHTML = renderBinView(); break;
        case 'history': container.innerHTML = renderHistoryView(); break;
        case 'library': container.innerHTML = renderLibraryView(); break;
        case 'upload': container.innerHTML = renderUploadView(); break;
        case 'beatmaker': container.innerHTML = renderBeatMakerView(); setTimeout(initBeatMakerAudio, 50); break;
        case 'settings': container.innerHTML = renderSettingsView(); break;
        default: container.innerHTML = renderHomeView();
    }
}

function renderAuthHeader() {
    const header = document.getElementById('authHeaderSection');
    if (!header) return;

    if (state.user) {
        header.innerHTML = `
            <div class="flex items-center space-x-3 bg-streamify-card px-4 py-2 rounded-xl border border-streamify-border">
                <div class="w-8 h-8 rounded-lg bg-streamify-green text-black font-bold flex items-center justify-center text-xs">
                    ${state.user.username[0].toUpperCase()}
                </div>
                <span class="text-xs font-semibold text-white">${state.user.username}</span>
            </div>
            <button onclick="logoutUser()" class="text-gray-400 hover:text-red-400 text-sm px-2 py-1" title="Log Out"><i class="fa-solid fa-right-from-bracket"></i></button>
        `;
    } else {
        header.innerHTML = `<button onclick="openAuthModal('login')" class="text-xs font-semibold text-white px-4 py-2 rounded-xl hover:text-streamify-green transition-colors">Log In</button>`;
    }
}

function renderSidebarLibraryTab() {
    const container = document.getElementById('sidebarLibrarySection');
    if (!container) return;

    if (state.user) {
        const isActive = state.currentRoute === 'library';
        container.innerHTML = `
            <button onclick="router.navigate('library')" id="nav-library" class="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'text-streamify-green bg-streamify-card border border-streamify-green/20' : 'text-gray-400 hover:text-white hover:bg-streamify-card'
            }">
                <i class="fa-solid fa-book-open-reader w-5"></i>
                <span>My Library</span>
            </button>
        `;
    } else {
        container.innerHTML = '';
    }
}

function playTrack(id) {
    const song = state.songs.find(s => s.id === id) || state.downloads.find(s => s.id === id) || state.bin.find(s => s.id === id);
    if (!song) return;
    state.currentTrack = song;
    const audioEl = document.getElementById('audioElement');
    audioEl.src = song.audio;
    audioEl.play().then(() => {
        state.isPlaying = true;
        updatePlayPauseIcon();
        updatePlayerBarInfo();
        addToHistory(song);
    }).catch(e => {
        console.error("Playback error:", e);
        showToast("Unable to play audio stream.", "error");
    });
}

function togglePlayPause() {
    if (!state.currentTrack) {
        if (state.songs.length > 0) playTrack(state.songs[0].id);
        return;
    }
    const audioEl = document.getElementById('audioElement');
    if (state.isPlaying) {
        audioEl.pause();
        state.isPlaying = false;
    } else {
        audioEl.play();
        state.isPlaying = true;
    }
    updatePlayPauseIcon();
}

function updatePlayPauseIcon() {
    const btn = document.getElementById('playPauseBtn');
    btn.innerHTML = state.isPlaying ? '<i class="fa-solid fa-pause text-sm"></i>' : '<i class="fa-solid fa-play text-sm ml-0.5"></i>';
}

function updatePlayerBarInfo() {
    if (!state.currentTrack) return;
    
    const canvas = document.getElementById('playerCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, 56, 56); };
    img.src = state.currentTrack.cover;

    document.getElementById('playerTitle').innerText = state.currentTrack.title;
    document.getElementById('playerArtist').innerText = state.currentTrack.artist;
    
    const isFav = state.favorites.some(f => f.id === state.currentTrack.id);
    const favBtn = document.getElementById('playerFavoriteBtn');
    favBtn.innerHTML = isFav ? '<i class="fa-solid fa-heart text-streamify-green"></i>' : '<i class="fa-regular fa-heart"></i>';

    const isDl = state.downloads.some(d => d.id === state.currentTrack.id);
    const dlBtn = document.getElementById('playerDownloadBtn');
    dlBtn.className = isDl ? "text-streamify-green transition-colors text-base p-1" : "text-gray-400 hover:text-streamify-green transition-colors text-base p-1";
}

function updateProgress() {
    const audioEl = document.getElementById('audioElement');
    if (audioEl.duration) {
        const progress = (audioEl.currentTime / audioEl.duration) * 100;
        document.getElementById('progressBar').value = progress;
        document.getElementById('currentTime').innerText = formatTime(audioEl.currentTime);
        document.getElementById('totalDuration').innerText = formatTime(audioEl.duration);
    }
}

function seekTrack(val) {
    const audioEl = document.getElementById('audioElement');
    if (audioEl.duration) {
        audioEl.currentTime = (val / 100) * audioEl.duration;
    }
}

function changeVolume(val) {
    const audioEl = document.getElementById('audioElement');
    audioEl.volume = val;
    state.volume = val;
    state.isMuted = val == 0;
    updateVolumeIcon();
}

function toggleMute() {
    const audioEl = document.getElementById('audioElement');
    state.isMuted = !state.isMuted;
    audioEl.muted = state.isMuted;
    updateVolumeIcon();
    document.getElementById('volumeBar').value = state.isMuted ? 0 : state.volume;
}

function updateVolumeIcon() {
    const btn = document.getElementById('muteBtn');
    const audioEl = document.getElementById('audioElement');
    btn.innerHTML = state.isMuted || audioEl.volume == 0 ? '<i class="fa-solid fa-volume-xmark text-red-400"></i>' : '<i class="fa-solid fa-volume-high"></i>';
}

function toggleShuffle() {
    state.isShuffle = !state.isShuffle;
    const btn = document.getElementById('shuffleBtn');
    btn.className = state.isShuffle ? "text-streamify-green" : "text-gray-400 hover:text-white";
    showToast(state.isShuffle ? "Shuffle Enabled" : "Shuffle Disabled");
}

function toggleRepeat() {
    state.isRepeat = !state.isRepeat;
    const btn = document.getElementById('repeatBtn');
    btn.className = state.isRepeat ? "text-streamify-green" : "text-gray-400 hover:text-white";
    showToast(state.isRepeat ? "Repeat Enabled" : "Repeat Disabled");
}

function handleTrackEnded() {
    if (state.isRepeat) {
        document.getElementById('audioElement').play();
        return;
    }
    playNext();
}

function playNext() {
    if (!state.currentTrack) return;
    const list = getFilteredSongs();
    let idx = list.findIndex(s => s.id === state.currentTrack.id);
    if (state.isShuffle) {
        idx = Math.floor(Math.random() * list.length);
    } else {
        idx = (idx + 1) % list.length;
    }
    if (list[idx]) playTrack(list[idx].id);
}

function playPrevious() {
    if (!state.currentTrack) return;
    const list = getFilteredSongs();
    let idx = list.findIndex(s => s.id === state.currentTrack.id);
    idx = (idx - 1 + list.length) % list.length;
    if (list[idx]) playTrack(list[idx].id);
}

function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function addToHistory(song) {
    state.history = state.history.filter(s => s.id !== song.id);
    state.history.unshift(song);
    if (state.history.length > 50) state.history.pop();
    saveState();
}

function getFilteredSongs() {
    return state.songs.filter(song => {
        const matchCat = state.activeCategory === 'All' || song.category === state.activeCategory;
        const matchSearch = song.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                            song.artist.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                            song.category.toLowerCase().includes(state.searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });
}

function handleSearch(query) {
    state.searchQuery = query;
    if (state.currentRoute !== 'home') {
        router.navigate('home');
    } else {
        renderView();
    }
}

function renderHomeView() {
    const categories = ['All', 'Pop', 'Hip-Hop', 'Rock', 'Afro-beat', 'Jazz', 'Reggae'];
    const filtered = getFilteredSongs();

    return `
        <div class="space-y-8">
            <div class="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none pt-2">
                ${categories.map(cat => `
                    <button onclick="setCategory('${cat}')" class="px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${                         state.activeCategory === cat ? 'bg-streamify-green text-black glow-green font-bold' : 'bg-streamify-card text-gray-300 hover:text-white border border-streamify-border'                     }">${cat}</button>
                `).join('')}
            </div>

            <div>
                <h3 class="text-xl font-bold mb-4 text-white">${state.activeCategory} Tracks (${filtered.length})</h3>
                ${filtered.length === 0 ? `
                    <div class="text-center py-20 bg-streamify-card rounded-2xl border border-streamify-border">
                        <i class="fa-solid fa-music text-4xl text-gray-600 mb-3"></i>
                        <p class="text-gray-400 text-sm">No tracks found matching your criteria.</p>
                    </div>
                ` : `
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        ${filtered.map(song => `
                            <div class="group bg-streamify-card p-4 rounded-2xl border border-streamify-border hover:border-streamify-green/50 transition-all flex flex-col justify-between cursor-pointer relative" onclick="playTrack('${song.id}')">
                                <div class="relative mb-4 aspect-square rounded-xl overflow-hidden bg-black">
                                    <img src="${song.cover}" alt="${song.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div class="w-12 h-12 rounded-full bg-streamify-green text-black flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                                            <i class="fa-solid fa-play ml-0.5"></i>
                                        </div>
                                    </div>
                                    <div class="absolute top-3 right-3 flex items-center space-x-1.5">
                                        <button onclick="event.stopPropagation(); toggleFavorite('${song.id}')" class="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-streamify-green transition-colors" title="Favorite">
                                            <i class="${state.favorites.some(f => f.id === song.id) ? 'fa-solid fa-heart text-streamify-green' : 'fa-regular fa-heart'}"></i>
                                        </button>
                                        <button onclick="event.stopPropagation(); downloadSong('${song.id}')" class="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-streamify-green transition-colors" title="Download">
                                            <i class="fa-solid fa-download"></i>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="font-semibold text-sm text-white truncate mb-1">${song.title}</h4>
                                    <p class="text-xs text-gray-400 truncate">${song.artist}</p>
                                </div>
                                <div class="mt-3 pt-2 border-t border-streamify-border/50 flex items-center justify-between text-xs text-gray-500">
                                    <span class="bg-black px-2 py-0.5 rounded text-[10px] text-streamify-green border border-streamify-green/20">${song.category}</span>
                                    <span><i class="fa-solid fa-heart text-[10px] mr-1"></i>${song.favoritesCount || 0}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

function setCategory(cat) {
    state.activeCategory = cat;
    renderView();
}

function renderLibraryView() {
    if (!state.user) {
        return renderLoginPrompt("Library requires authentication. Please log in to view your uploaded music.");
    }

    const myUploadedSongs = state.songs.filter(s => s.uploader === state.user.id || s.uploader === state.user.username);
    const totalLikesAcrossAll = myUploadedSongs.reduce((acc, s) => acc + (s.favoritesCount || 0), 0);

    return `
        <div class="space-y-8 max-w-5xl mx-auto">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-white mb-1">My Creator Library</h2>
                    <p class="text-gray-400 text-sm">Manage your uploaded tracks, view likes and user engagement, and edit track details.</p>
                </div>
                <button onclick="router.navigate('upload')" class="bg-streamify-green text-black px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-streamify-greenHover transition-all glow-green flex items-center space-x-2 w-fit">
                    <i class="fa-solid fa-cloud-arrow-up"></i><span>Upload New Track</span>
                </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div class="bg-streamify-card p-6 rounded-2xl border border-streamify-border flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-xl bg-streamify-green/15 border border-streamify-green/30 flex items-center justify-center text-streamify-green text-xl">
                        <i class="fa-solid fa-music"></i>
                    </div>
                    <div>
                        <h4 class="text-2xl font-bold text-white">${myUploadedSongs.length}</h4>
                        <p class="text-xs text-gray-400">Total Uploads</p>
                    </div>
                </div>
                <div class="bg-streamify-card p-6 rounded-2xl border border-streamify-border flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-xl bg-streamify-green/15 border border-streamify-green/30 flex items-center justify-center text-streamify-green text-xl">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                    <div>
                        <h4 class="text-2xl font-bold text-white">${totalLikesAcrossAll}</h4>
                        <p class="text-xs text-gray-400">Total Track Likes</p>
                    </div>
                </div>
                <div class="bg-streamify-card p-6 rounded-2xl border border-streamify-border flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-xl bg-streamify-green/15 border border-streamify-green/30 flex items-center justify-center text-streamify-green text-xl">
                        <i class="fa-solid fa-user-check"></i>
                    </div>
                    <div>
                        <h4 class="text-2xl font-bold text-white">Active</h4>
                        <p class="text-xs text-gray-400">Creator Status</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 class="text-lg font-bold mb-4 text-white">Uploaded Tracks & Analytics</h3>
                ${myUploadedSongs.length === 0 ? `
                    <div class="text-center py-20 bg-streamify-card rounded-2xl border border-streamify-border">
                        <i class="fa-solid fa-cloud-arrow-up text-4xl text-gray-600 mb-3"></i>
                        <p class="text-gray-400 text-sm mb-4">You haven't uploaded any music yet.</p>
                        <button onclick="router.navigate('upload')" class="bg-streamify-green text-black px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-streamify-greenHover transition-all">Upload Your First Song</button>
                    </div>
                ` : `
                    <div class="space-y-4">
                        ${myUploadedSongs.map(song => {
                            const likersList = song.likedBy && song.likedBy.length > 0 ? song.likedBy.join(', ') : 'No likes yet';
                            return `
                                <div class="bg-streamify-card p-5 rounded-2xl border border-streamify-border flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-streamify-green/30 transition-all">
                                    <div class="flex items-center space-x-4 cursor-pointer" onclick="playTrack('${song.id}')">
                                        <img src="${song.cover}" class="w-16 h-16 rounded-xl object-cover border border-streamify-border">
                                        <div>
                                            <h4 class="font-bold text-base text-white">${song.title}</h4>
                                            <p class="text-xs text-gray-400">Artist: ${song.artist} • Category: <span class="text-streamify-green">${song.category}</span></p>
                                            <p class="text-xs text-gray-500 mt-1"><i class="fa-solid fa-heart text-streamify-green mr-1"></i><strong>${song.favoritesCount || 0} Likes</strong> (${likersList})</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-3 self-end md:self-center">
                                        <button onclick="openEditModal('${song.id}')" class="bg-black border border-streamify-border text-gray-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5">
                                            <i class="fa-solid fa-pen-to-square"></i><span>Edit</span>
                                        </button>
                                        <button onclick="deleteUploadedSong('${song.id}')" class="bg-red-950/30 border border-red-500/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5">
                                            <i class="fa-solid fa-trash"></i><span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

function openEditModal(songId) {
    const song = state.songs.find(s => s.id === songId);
    if (!song) return;

    const container = document.getElementById('modalContainer');
    container.innerHTML = `
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-streamify-card border border-streamify-border w-full max-w-md rounded-2xl p-8 relative space-y-6">
                <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button>
                
                <div>
                    <h3 class="text-xl font-bold text-white mb-1">Edit Track Details</h3>
                    <p class="text-xs text-gray-400">Update your song title, category, or choose a new cover picture from your device.</p>
                </div>

                <form onsubmit="handleEditSubmit(event, '${song.id}')" class="space-y-4">
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Song Title</label>
                        <input type="text" id="editTitle" required value="${song.title}" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green">
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Category</label>
                        <select id="editCategory" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green">
                            <option value="Pop" ${song.category === 'Pop' ? 'selected' : ''}>Pop</option>
                            <option value="Hip-Hop" ${song.category === 'Hip-Hop' ? 'selected' : ''}>Hip-Hop</option>
                            <option value="Rock" ${song.category === 'Rock' ? 'selected' : ''}>Rock</option>
                            <option value="Afro-beat" ${song.category === 'Afro-beat' ? 'selected' : ''}>Afro-beat</option>
                            <option value="Jazz" ${song.category === 'Jazz' ? 'selected' : ''}>Jazz</option>
                            <option value="Reggae" ${song.category === 'Reggae' ? 'selected' : ''}>Reggae</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">New Album Picture (from Device)</label>
                        <input type="file" id="editCoverFile" accept="image/*" class="w-full text-xs text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-streamify-green file:text-black hover:file:bg-streamify-greenHover cursor-pointer">
                    </div>

                    <button type="submit" class="w-full bg-streamify-green text-black py-3 rounded-xl font-bold text-sm hover:bg-streamify-greenHover transition-all glow-green mt-2">
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    `;
}

function handleEditSubmit(e, songId) {
    e.preventDefault();
    const title = document.getElementById('editTitle').value;
    const category = document.getElementById('editCategory').value;
    const coverFileInput = document.getElementById('editCoverFile');

    const song = state.songs.find(s => s.id === songId);
    if (song) {
        song.title = title;
        song.category = category;
        
        if (coverFileInput.files && coverFileInput.files.length > 0) {
            song.cover = URL.createObjectURL(coverFileInput.files[0]);
        }

        saveState();
        closeAuthModal();
        renderView();
        showToast("Track details updated successfully!");
    }
}

function deleteUploadedSong(songId) {
    if (confirm("Are you sure you want to delete this uploaded song?")) {
        state.songs = state.songs.filter(s => s.id !== songId);
        state.favorites = state.favorites.filter(f => f.id !== songId);
        saveState();
        renderView();
        showToast("Track deleted from platform");
    }
}

function renderFavoritesView() {
    if (!state.user) {
        return renderLoginPrompt("Favorites require authentication. Please log in to view your favorite tracks.");
    }

    return `
        <div class="space-y-8">
            <div>
                <h2 class="text-2xl font-bold text-white mb-1">Your Favorites</h2>
                <p class="text-gray-400 text-sm">Manage your saved favorite tracks.</p>
            </div>

            <div class="bg-streamify-card rounded-2xl border border-streamify-border overflow-hidden">
                ${state.favorites.length === 0 ? `
                    <div class="text-center py-16">
                        <i class="fa-regular fa-heart text-4xl text-gray-600 mb-3"></i>
                        <p class="text-gray-400 text-sm">You haven't favorited any tracks yet.</p>
                    </div>
                ` : state.favorites.map((song, idx) => `
                    <div class="flex items-center justify-between p-4 border-b border-streamify-border/50 hover:bg-streamify-cardHover transition-colors cursor-pointer" onclick="playTrack('${song.id}')">
                        <div class="flex items-center space-x-4">
                            <span class="text-xs text-gray-500 w-4">${idx + 1}</span>
                            <img src="${song.cover}" class="w-12 h-12 rounded-lg object-cover">
                            <div>
                                <h4 class="font-semibold text-sm text-white">${song.title}</h4>
                                <p class="text-xs text-gray-400">${song.artist}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span class="hidden sm:inline-block bg-black px-3 py-1 rounded-full text-xs text-streamify-green border border-streamify-green/20">${song.category}</span>
                            <button onclick="event.stopPropagation(); toggleFavorite('${song.id}')" class="text-streamify-green hover:text-streamify-green/80 p-2 text-lg" title="Favorited">
                                <i class="fa-solid fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function toggleFavorite(songId) {
    if (!state.user) {
        openAuthModal('login');
        showToast("Please log in to manage favorites.", "error");
        return;
    }
    const song = state.songs.find(s => s.id === songId);
    if (!song) return;

    const favIndex = state.favorites.findIndex(f => f.id === songId);
    
    if (favIndex === -1) {
        state.favorites.push(song);
        song.favoritesCount = (song.favoritesCount || 0) + 1;
        if (!song.likedBy) song.likedBy = [];
        if (!song.likedBy.includes(state.user.username)) {
            song.likedBy.push(state.user.username);
        }
        showToast("Added to favorites");
    } else {
        state.favorites.splice(favIndex, 1);
        song.favoritesCount = Math.max(0, (song.favoritesCount || 1) - 1);
        if (song.likedBy) {
            song.likedBy = song.likedBy.filter(u => u !== state.user.username);
        }
        showToast("Removed from favorites");
    }

    saveState();
    renderView();
    updatePlayerBarInfo();
}

function toggleFavoriteCurrentTrack() {
    if (state.currentTrack) {
        toggleFavorite(state.currentTrack.id);
    } else {
        showToast("No track currently selected.", "error");
    }
}

function renderDownloadsView() {
    return `
        <div class="space-y-6">
            <div>
                <h2 class="text-2xl font-bold text-white mb-1">Downloaded Tracks</h2>
                <p class="text-gray-400 text-sm">Manage offline tracks stored on your device.</p>
            </div>

            ${state.downloads.length === 0 ? `
                <div class="text-center py-20 bg-streamify-card rounded-2xl border border-streamify-border">
                    <i class="fa-solid fa-download text-4xl text-gray-600 mb-3"></i>
                    <p class="text-gray-400 text-sm">No downloaded tracks found.</p>
                </div>
            ` : `
                <div class="bg-streamify-card rounded-2xl border border-streamify-border overflow-hidden">
                    ${state.downloads.map((song, idx) => `
                        <div class="flex items-center justify-between p-4 border-b border-streamify-border/50 hover:bg-streamify-cardHover transition-colors cursor-pointer" onclick="playTrack('${song.id}')">
                            <div class="flex items-center space-x-4">
                                <span class="text-xs text-gray-500 w-4">${idx + 1}</span>
                                <img src="${song.cover}" class="w-12 h-12 rounded-lg object-cover">
                                <div>
                                    <h4 class="font-semibold text-sm text-white">${song.title}</h4>
                                    <p class="text-xs text-gray-400">${song.artist}</p>
                                </div>
                            </div>
                            <button onclick="event.stopPropagation(); deleteDownloadToBin('${song.id}')" class="text-gray-400 hover:text-red-400 p-2 text-lg" title="Move to Bin">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

function downloadSong(id) {
    const track = state.songs.find(s => s.id === id) || state.favorites.find(s => s.id === id);
    if (!track) return;
    if (!state.downloads.some(d => d.id === track.id)) {
        state.downloads.push(track);
        saveState();
        showToast(`Downloaded "${track.title}" successfully!`);
        updatePlayerBarInfo();
    } else {
        showToast("Track already downloaded.");
    }
}

function downloadCurrentTrack() {
    const track = state.currentTrack || state.songs[0];
    if (!track) return;
    downloadSong(track.id);
}

function deleteDownloadToBin(id) {
    const idx = state.downloads.findIndex(d => d.id === id);
    if (idx > -1) {
        const song = state.downloads.splice(idx, 1)[0];
        state.bin.push(song);
        saveState();
        renderView();
        showToast(`Moved "${song.title}" to bin`);
    }
}

function renderBinView() {
    return `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-white mb-1">Recycle Bin</h2>
                    <p class="text-gray-400 text-sm">Restore previously deleted downloads.</p>
                </div>
                ${state.bin.length > 0 ? `<button onclick="emptyBin()" class="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/40 border border-red-500/30 px-4 py-2 rounded-xl transition-all">Empty Bin</button>` : ''}
            </div>

            ${state.bin.length === 0 ? `
                <div class="text-center py-20 bg-streamify-card rounded-2xl border border-streamify-border">
                    <i class="fa-solid fa-trash-can text-4xl text-gray-600 mb-3"></i>
                    <p class="text-gray-400 text-sm">Your bin is empty.</p>
                </div>
            ` : `
                <div class="bg-streamify-card rounded-2xl border border-streamify-border overflow-hidden">
                    ${state.bin.map((song, idx) => `
                        <div class="flex items-center justify-between p-4 border-b border-streamify-border/50 hover:bg-streamify-cardHover transition-colors cursor-pointer" onclick="playTrack('${song.id}')">
                            <div class="flex items-center space-x-4">
                                <span class="text-xs text-gray-500 w-4">${idx + 1}</span>
                                <img src="${song.cover}" class="w-12 h-12 rounded-lg object-cover">
                                <div>
                                    <h4 class="font-semibold text-sm text-white">${song.title}</h4>
                                    <p class="text-xs text-gray-400">${song.artist}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3">
                                <button onclick="event.stopPropagation(); restoreFromBin('${song.id}')" class="bg-streamify-green/15 border border-streamify-green/30 text-streamify-green hover:bg-streamify-green hover:text-black px-3 py-1.5 rounded-xl text-xs font-semibold transition-all">Restore</button>
                                <button onclick="event.stopPropagation(); permanentDelete('${song.id}')" class="text-gray-400 hover:text-red-400 p-2 text-base" title="Delete Permanently"><i class="fa-solid fa-xmark"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

function restoreFromBin(id) {
    const idx = state.bin.findIndex(b => b.id === id);
    if (idx > -1) {
        const song = state.bin.splice(idx, 1)[0];
        state.downloads.push(song);
        saveState();
        renderView();
        showToast(`Restored "${song.title}" to downloads`);
    }
}

function permanentDelete(id) {
    state.bin = state.bin.filter(b => b.id !== id);
    saveState();
    renderView();
    showToast("Permanently deleted from bin");
}

function emptyBin() {
    state.bin = [];
    saveState();
    renderView();
    showToast("Bin emptied");
}

function renderHistoryView() {
    return `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-white mb-1">Listening History</h2>
                    <p class="text-gray-400 text-sm">Recently played tracks on Streamify.</p>
                </div>
                ${state.history.length > 0 ? `<button onclick="clearHistory()" class="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/40 border border-red-500/30 px-4 py-2 rounded-xl transition-all">Clear History</button>` : ''}
            </div>

            ${state.history.length === 0 ? `
                <div class="text-center py-20 bg-streamify-card rounded-2xl border border-streamify-border">
                    <i class="fa-solid fa-clock-rotate-left text-4xl text-gray-600 mb-3"></i>
                    <p class="text-gray-400 text-sm">No playback history recorded yet.</p>
                </div>
            ` : `
                <div class="bg-streamify-card rounded-2xl border border-streamify-border overflow-hidden">
                    ${state.history.map((song, idx) => `
                        <div class="flex items-center justify-between p-4 border-b border-streamify-border/50 hover:bg-streamify-cardHover transition-colors cursor-pointer" onclick="playTrack('${song.id}')">
                            <div class="flex items-center space-x-4">
                                <span class="text-xs text-gray-500 w-4">${idx + 1}</span>
                                <img src="${song.cover}" class="w-12 h-12 rounded-lg object-cover">
                                <div>
                                    <h4 class="font-semibold text-sm text-white">${song.title}</h4>
                                    <p class="text-xs text-gray-400">${song.artist}</p>
                                </div>
                            </div>
                            <span class="bg-black px-3 py-1 rounded-full text-xs text-streamify-green border border-streamify-green/20">${song.category}</span>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

function clearHistory() {
    state.history = [];
    saveState();
    renderView();
    showToast("History cleared");
}

function renderUploadView() {
    if (!state.user) {
        return renderLoginPrompt("Uploading music requires authentication. Please log in or sign up to publish your tracks.");
    }

    return `
        <div class="max-w-2xl mx-auto space-y-8 bg-streamify-card p-8 rounded-2xl border border-streamify-border">
            <div>
                <h2 class="text-2xl font-bold text-white mb-1">Upload Your Music</h2>
                <p class="text-gray-400 text-sm">Share your audio tracks and cover art from your device with the Streamify community.</p>
            </div>

            <form onsubmit="handleUploadSubmit(event)" class="space-y-6">
                <div class="space-y-2">
                    <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Song Title</label>
                    <input type="text" id="uploadTitle" required placeholder="e.g. Cyberpunk Odyssey" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green transition-all">
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Artist Name</label>
                    <input type="text" id="uploadArtist" required value="${state.user.username}" placeholder="Artist or Band Name" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green transition-all">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Category</label>
                        <select id="uploadCategory" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green transition-all">
                            <option value="Pop">Pop</option>
                            <option value="Hip-Hop">Hip-Hop</option>
                            <option value="Rock">Rock</option>
                            <option value="Afro-beat">Afro-beat</option>
                            <option value="Jazz">Jazz</option>
                            <option value="Reggae">Reggae</option>
                        </select>
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Audio File (MP3)</label>
                        <input type="file" id="uploadAudioFile" accept="audio/*" required class="w-full text-xs text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-streamify-green file:text-black hover:file:bg-streamify-greenHover cursor-pointer">
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Album Art Cover Picture (from Device)</label>
                    <input type="file" id="uploadCoverFile" accept="image/*" class="w-full text-xs text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-streamify-green file:text-black hover:file:bg-streamify-greenHover cursor-pointer">
                </div>

                <button type="submit" class="w-full bg-streamify-green text-black py-3.5 rounded-xl font-bold text-sm hover:bg-streamify-greenHover transition-all glow-green">
                    Upload & Publish Track
                </button>
            </form>
        </div>
    `;
}

function handleUploadSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('uploadTitle').value;
    const artist = document.getElementById('uploadArtist').value;
    const category = document.getElementById('uploadCategory').value;
    const audioInput = document.getElementById('uploadAudioFile');
    const coverFileInput = document.getElementById('uploadCoverFile');

    if (!audioInput.files || audioInput.files.length === 0) {
        showToast("Please select an audio file.", "error");
        return;
    }

    const audioUrl = URL.createObjectURL(audioInput.files[0]);
    const cover = (coverFileInput.files && coverFileInput.files.length > 0)
        ? URL.createObjectURL(coverFileInput.files[0])
        : generateLocalCoverDataUrl(title, '#002211', '#004422');

    const newSong = {
        id: 'song_' + Date.now(),
        title,
        artist,
        category,
        cover,
        audio: audioUrl,
        uploader: state.user.id,
        likedBy: [],
        favoritesCount: 0
    };

    state.songs.unshift(newSong);
    saveState();
    showToast("Track published successfully to Streamify!");
    router.navigate('library');
}

function renderBeatMakerView() {
    if (!state.user) {
        return renderLoginPrompt("Beat Maker studio requires authentication. Please log in or sign up to create and publish beats.");
    }

    return `
        <div class="max-w-4xl mx-auto space-y-8 bg-streamify-card p-8 rounded-2xl border border-streamify-border">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-white mb-1">Cyber Beat Maker & Vocal Studio</h2>
                    <p class="text-gray-400 text-sm">Sequence 5 drum/synth tracks across 16 steps and record your vocals.</p>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="toggleSequencerPlay()" id="seqPlayBtn" class="bg-streamify-green text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-streamify-greenHover transition-all glow-green flex items-center space-x-2">
                        <i class="fa-solid fa-play"></i><span>Play Beat</span>
                    </button>
                    <button onclick="clearSequencer()" class="bg-black border border-streamify-border text-gray-300 px-4 py-2.5 rounded-xl font-semibold text-sm hover:text-white">Clear</button>
                </div>
            </div>

            <div class="bg-black p-6 rounded-2xl border border-streamify-border space-y-4 overflow-x-auto">
                <div class="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 border-b border-streamify-border">
                    <span>Instrument / Step</span>
                    <div class="flex space-x-2">
                        ${Array.from({length: 16}, (_, i) => `<span class="w-6 sm:w-8 text-center">${i + 1}</span>`).join('')}
                    </div>
                </div>
                <div id="sequencerTracksContainer" class="space-y-3"></div>
            </div>

            <div class="bg-black p-6 rounded-2xl border border-streamify-border grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div>
                    <h3 class="font-bold text-white text-base mb-1"><i class="fa-solid fa-microphone text-streamify-green mr-2"></i>Vocal Recorder</h3>
                    <p class="text-xs text-gray-400">Record your vocals over the rhythm sequence.</p>
                </div>
                <div class="flex items-center space-x-4 justify-start sm:justify-end">
                    <button onclick="toggleVocalRecording()" id="recordBtn" class="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-2 transition-all">
                        <i class="fa-solid fa-circle text-xs animate-pulse"></i><span id="recordBtnText">Record Vocals</span>
                    </button>
                    <span id="recordStatus" class="text-xs text-gray-400">Ready</span>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div class="space-y-2">
                    <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Beat Title</label>
                    <input type="text" id="beatTitle" placeholder="Cyber Anthem Vol. 1" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green">
                </div>
                <div class="space-y-2">
                    <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Category</label>
                    <select id="beatCategory" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green">
                        <option value="Hip-Hop">Hip-Hop</option>
                        <option value="Pop">Pop</option>
                        <option value="Rock">Rock</option>
                        <option value="Afro-beat">Afro-beat</option>
                        <option value="Electronic">Electronic</option>
                    </select>
                </div>
                <div class="space-y-2">
                    <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Album Art (from Device)</label>
                    <input type="file" id="beatCoverFile" accept="image/*" class="w-full text-xs text-gray-400 file:mr-2 file:py-2.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-streamify-green file:text-black hover:file:bg-streamify-greenHover cursor-pointer">
                </div>
            </div>

            <div class="pt-2">
                <button onclick="publishBeat()" class="w-full bg-streamify-green text-black py-3.5 rounded-xl font-bold text-sm hover:bg-streamify-greenHover transition-all glow-green">Publish Created Beat</button>
            </div>
        </div>
    `;
}

const instruments = ['Kick', 'Snare', 'Hi-Hat', 'Synth', 'Bass'];
let seqGrid = Array(5).fill(0).map(() => Array(16).fill(false));
let isSeqPlaying = false;
let currentStep = 0;
let seqInterval = null;
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob = null;

function initBeatMakerAudio() {
    renderSequencerGrid();
}

function renderSequencerGrid() {
    const container = document.getElementById('sequencerTracksContainer');
    if (!container) return;

    container.innerHTML = instruments.map((inst, rIdx) => `
        <div class="flex items-center justify-between">
            <span class="w-24 text-xs font-semibold text-gray-300">${inst}</span>
            <div class="flex space-x-2">
                ${Array.from({length: 16}, (_, cIdx) => `
                    <button onclick="toggleStep(${rIdx},${cIdx})" id="step_${rIdx}_${cIdx}" class="w-6 sm:w-8 h-8 rounded-lg border transition-all ${
                        seqGrid[rIdx][cIdx] ? 'bg-streamify-green border-streamify-green glow-green' : 'bg-streamify-card border-streamify-border hover:border-gray-500'
                    }"></button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function toggleStep(r, c) {
    seqGrid[r][c] = !seqGrid[r][c];
    const btn = document.getElementById(`step_${r}_${c}`);
    if (btn) {
        btn.className = `w-6 sm:w-8 h-8 rounded-lg border transition-all ${
            seqGrid[r][c] ? 'bg-streamify-green border-streamify-green glow-green' : 'bg-streamify-card border-streamify-border hover:border-gray-500'
        }`;
    }
}

function clearSequencer() {
    seqGrid = Array(5).fill(0).map(() => Array(16).fill(false));
    renderSequencerGrid();
    showToast("Sequencer cleared");
}

function toggleSequencerPlay() {
    isSeqPlaying = !isSeqPlaying;
    const btn = document.getElementById('seqPlayBtn');
    btn.innerHTML = isSeqPlaying ? '<i class="fa-solid fa-pause"></i><span>Pause</span>' : '<i class="fa-solid fa-play"></i><span>Play Beat</span>';

    if (isSeqPlaying) {
        currentStep = 0;
        const bpm = 120;
        const intervalMs = (60 / bpm / 4) * 1000;
        seqInterval = setInterval(() => {
            playSequencerStep(currentStep);
            highlightStepColumn(currentStep);
            currentStep = (currentStep + 1) % 16;
        }, intervalMs);
    } else {
        clearInterval(seqInterval);
        highlightStepColumn(-1);
    }
}

function highlightStepColumn(step) {
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 16; c++) {
            const btn = document.getElementById(`step_${r}_${c}`);
            if (!btn) continue;
            const active = seqGrid[r][c];
            if (c === step && isSeqPlaying) {
                btn.style.borderColor = '#FFFFFF';
            } else {
                btn.style.borderColor = active ? '#00FF66' : '#282828';
            }
        }
    }
}

function playSequencerStep(step) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        for (let r = 0; r < 5; r++) {
            if (seqGrid[r][step]) {
                playSynthSound(ctx, r);
            }
        }
    } catch (e) {
        console.error("Web Audio error:", e);
    }
}

function playSynthSound(ctx, type) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 0) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 1) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 2) {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 3) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 4) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    }
}

let isRecording = false;
function toggleVocalRecording() {
    const btnText = document.getElementById('recordBtnText');
    const status = document.getElementById('recordStatus');
    const btn = document.getElementById('recordBtn');

    if (!isRecording) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                recordedAudioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                status.innerText = "Vocals Recorded Successfully!";
            };
            mediaRecorder.start();
            isRecording = true;
            btnText.innerText = "Stop Recording";
            btn.className = "bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-2 transition-all";
            status.innerText = "Recording vocals...";
        }).catch(err => {
            console.error("Mic access denied:", err);
            showToast("Microphone access denied or unavailable.", "error");
        });
    } else {
        if (mediaRecorder) mediaRecorder.stop();
        isRecording = false;
        btnText.innerText = "Record Vocals";
        btn.className = "bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-2 transition-all";
    }
}

function publishBeat() {
    const title = document.getElementById('beatTitle').value || "Cyber Anthem Beat";
    const category = document.getElementById('beatCategory').value;
    const coverFileInput = document.getElementById('beatCoverFile');
    const audioUrl = recordedAudioBlob ? URL.createObjectURL(recordedAudioBlob) : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    const cover = (coverFileInput.files && coverFileInput.files.length > 0)
        ? URL.createObjectURL(coverFileInput.files[0])
        : generateLocalCoverDataUrl(title, '#220022', '#002222');

    const newSong = {
        id: 'beat_' + Date.now(),
        title,
        artist: state.user.username,
        category,
        cover,
        audio: audioUrl,
        uploader: state.user.id,
        likedBy: [],
        favoritesCount: 0
    };

    state.songs.unshift(newSong);
    saveState();
    showToast("Beat published successfully with custom album art!");
    router.navigate('library');
}

function renderSettingsView() {
    return `
        <div class="max-w-2xl mx-auto space-y-8 bg-streamify-card p-8 rounded-2xl border border-streamify-border">
            <div>
                <h2 class="text-2xl font-bold text-white mb-1">Platform Settings</h2>
                <p class="text-gray-400 text-sm">Customize your username, preferences, and profile.</p>
            </div>

            ${state.user ? `
                <form onsubmit="handleProfileUpdate(event)" class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Username</label>
                        <input type="text" id="settingsUsername" value="${state.user.username}" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green">
                    </div>

                    <button type="submit" class="w-full bg-streamify-green text-black py-3 rounded-xl font-bold text-sm hover:bg-streamify-greenHover transition-all glow-green">Save Username</button>
                </form>
            ` : `
                <div class="bg-black p-6 rounded-2xl border border-streamify-border text-center space-y-4">
                    <p class="text-sm text-gray-400">You are currently browsing as a guest.</p>
                    <button onclick="openAuthModal('login')" class="bg-streamify-green text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-streamify-greenHover transition-all glow-green">Log In / Sign Up</button>
                </div>
            `}

            <div class="pt-6 border-t border-streamify-border space-y-3">
                <h3 class="font-bold text-white text-sm">About Streamify</h3>
                <p class="text-xs text-gray-400 leading-relaxed">
                    Streamify is a fully self-contained web music streaming and creation studio platform.
                </p>
                <p class="text-[10px] text-gray-500 pt-2">Version 2.7.0 • All Rights Reserved © 2026 Streamify Platform</p>
            </div>

            ${state.user ? `
                <div class="pt-6 border-t border-streamify-border">
                    <button onclick="logoutUser()" class="w-full bg-red-950/40 border border-red-500/30 text-red-400 py-3 rounded-xl font-bold text-sm hover:bg-red-900/40 transition-all">Log Out</button>
                </div>
            ` : ''}
        </div>
    `;
}

function handleProfileUpdate(e) {
    e.preventDefault();
    const username = document.getElementById('settingsUsername').value;
    if (username) state.user.username = username;
    saveState();
    renderView();
    showToast("Username updated successfully!");
}

function logoutUser() {
    state.user = null;
    saveState();
    router.navigate('home');
    showToast("Logged out successfully");
}

function renderLoginPrompt(message) {
    return `
        <div class="max-w-md mx-auto my-20 bg-streamify-card p-8 rounded-2xl border border-streamify-border text-center space-y-6">
            <div class="w-16 h-16 rounded-2xl bg-streamify-green/15 border border-streamify-green/30 flex items-center justify-center text-streamify-green text-2xl mx-auto glow-green">
                <i class="fa-solid fa-lock"></i>
            </div>
            <div>
                <h3 class="font-bold text-lg text-white mb-2">Authentication Required</h3>
                <p class="text-xs text-gray-400 leading-relaxed">${message}</p>
            </div>
            <div class="flex space-x-3">
                <button onclick="openAuthModal('login')" class="flex-1 bg-streamify-green text-black py-3 rounded-xl font-bold text-sm hover:bg-streamify-greenHover transition-all glow-green">Log In</button>
                <button onclick="openAuthModal('signup')" class="flex-1 bg-black border border-streamify-border text-white py-3 rounded-xl font-bold text-sm hover:bg-streamify-cardHover transition-all">Sign Up</button>
            </div>
        </div>
    `;
}

function openAuthModal(mode = 'login') {
    const container = document.getElementById('modalContainer');
    container.innerHTML = `
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-streamify-card border border-streamify-border w-full max-w-md rounded-2xl p-8 relative space-y-6">
                <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button>
                
                <div class="flex justify-center">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-streamify-green to-emerald-700 flex items-center justify-center glow-green shadow-lg">
                        <i class="fa-solid fa-users text-black text-2xl"></i>
                    </div>
                </div>

                <div class="text-center">
                    <h3 class="text-2xl font-bold text-white mb-1">Welcome to Streamify</h3>
                    <p class="text-xs text-gray-400">Sign in or register to access your Library & creator studio</p>
                </div>

                <div class="grid grid-cols-2 bg-black p-1 rounded-xl border border-streamify-border">
                    <button type="button" onclick="openAuthModal('login')" class="py-2.5 rounded-lg text-xs font-semibold transition-all ${mode === 'login' ? 'bg-streamify-green text-black glow-green font-bold' : 'text-gray-400 hover:text-white'}">
                        Sign In
                    </button>
                    <button type="button" onclick="openAuthModal('signup')" class="py-2.5 rounded-lg text-xs font-semibold transition-all ${mode === 'signup' ? 'bg-streamify-green text-black glow-green font-bold' : 'text-gray-400 hover:text-white'}">
                        Create Account
                    </button>
                </div>

                <form onsubmit="handleAuthSubmit(event, '${mode}')" class="space-y-4">
                    ${mode === 'signup' ? `
                        <div class="space-y-1">
                            <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Username</label>
                            <input type="text" id="authUsername" required placeholder="cyberArtist" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green">
                        </div>
                    ` : ''}
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Email Address</label>
                        <input type="email" id="authEmail" required placeholder="artist@gmail.com" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green">
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Password</label>
                        <input type="password" id="authPassword" required placeholder="••••••••" class="w-full bg-black border border-streamify-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-streamify-green">
                    </div>

                    <button type="submit" class="w-full bg-streamify-green text-black py-3.5 rounded-xl font-bold text-sm hover:bg-streamify-greenHover transition-all glow-green flex items-center justify-center space-x-2 mt-2">
                        <i class="fa-solid fa-right-to-bracket text-xs"></i><span>${mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    </button>
                </form>
            </div>
        </div>
    `;
}

function closeAuthModal() {
    document.getElementById('modalContainer').innerHTML = '';
}

function handleAuthSubmit(e, mode) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const username = mode === 'signup' ? document.getElementById('authUsername').value : email.split('@')[0];

    state.user = {
        id: 'user_' + Date.now(),
        username,
        email
    };

    saveState();
    closeAuthModal();
    renderView();
    showToast(`Welcome back, ${username}!`);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-md border transition-all ${
        type === 'error' ? 'bg-red-950/90 text-red-300 border-red-500/30' : 'bg-streamify-card text-white border-streamify-green/30'
    }`;
    toast.innerHTML = `<div class="flex items-center space-x-2"><i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation text-red-400' : 'fa-circle-check text-streamify-green'}"></i><span>${message}</span></div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.onload = function() {
    renderView();
    initHoverPlayer();
};