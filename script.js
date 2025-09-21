document.addEventListener('DOMContentLoaded', function () {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2KKQ1I06_ekwmIsCuwiliRbqu44Y9pBpSO2HuGpxQLv485PlDZ4tyDUlDjJGu3UJeXJQdLuPNxdkA/pub?output=csv';

    const landingPage = document.getElementById('landing-page');
    const membersPage = document.getElementById('members-page');
    const enterBtn = document.getElementById('enter-btn');
    const backToLandingBtn = document.getElementById('back-to-landing-btn');
    const leaderSection = document.getElementById('leader-section');
    const membersSection = document.getElementById('members-section');
    const leaderGrid = document.querySelector('.leader-grid');
    const membersGrid = document.querySelector('#members-section .member-grid');
    const searchInput = document.getElementById('searchInput');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const paginationControls = document.querySelector('.pagination-controls');
    const audioPlayerContainer = document.getElementById('audio-player-container');
    const body = document.body;
    const canvas = document.getElementById('canvas-bg');
    const ctx = canvas.getContext('2d');
    let particles = [];

    let allMembersData = [];
    let leadersData = [];
    let filteredMembers = [];
    let currentPage = 1;
    let itemsPerPage = 15;

    // Background particle network
    function resizeCanvas() {
        if(canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = 'rgba(255, 255, 255, 0.8)';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
            if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const numberOfParticles = (canvas.width * canvas.height) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            particles.push(new Particle(x, y));
        }
    }

    function connectParticles() {
        let opacityValue = 1;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const distance = ((particles[a].x - particles[b].x) ** 2) + ((particles[a].y - particles[b].y) ** 2);
                if (distance < (canvas.width/7) * (canvas.height/7)) {
                    opacityValue = 1 - (distance / ((canvas.width/7) * (canvas.height/7)));
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        connectParticles();
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();

    // Scroll Reveal Animation
    function revealElements() {
        const revealElements = document.querySelectorAll('.scroll-reveal');
        const windowHeight = window.innerHeight;
        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - 100) {
                el.classList.add('is-visible');
            } else {
                el.classList.remove('is-visible');
            }
        });
    }
    window.addEventListener('scroll', revealElements);

    function createMemberCardHTML(member, isLeader = false) {
        const cardClass = isLeader ? 'member-card leader-card' : 'member-card';
        const name = member.name || '';
        const facebookLink = member.facebookLink || '#';
        const pictureLink = member.pictureLink || 'https://via.placeholder.com/150';
        const shortLink = facebookLink.replace(/^https?:\/\/(www\.)?/, '');

        return `
            <div class="${cardClass}">
                <img src="${pictureLink}" alt="Profile Picture" class="profile-pic">
                <div class="member-info">
                    <h3>${name}</h3>
                    <a href="${facebookLink}" target="_blank">${shortLink}</a>
                </div>
                <a href="${facebookLink}" target="_blank" class="profile-link"><i class="fab fa-facebook-f"></i></a>
            </div>
        `;
    }

    async function fetchAndDisplayMembers() {
        try {
            const response = await fetch(sheetUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const csvText = await response.text();
            
            const rows = csvText.trim().split(/\r?\n/);
            const headers = rows.shift().split(',').map(h => h.trim());
            allMembersData = rows.map(row => {
                const values = row.split(',');
                return {
                    name: values[0]?.trim() || '',
                    facebookLink: values[1]?.trim() || '',
                    role: values[2]?.trim() || '',
                    pictureLink: values[3]?.trim() || ''
                };
            }).filter(m => m.name);

            leadersData = allMembersData.filter(m => m.role === 'Leader');
            
            initializePageFunctionality();
            revealElements();

        } catch (error) {
            console.error('Error fetching or parsing sheet data:', error);
            membersGrid.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        }
    }
    
    function initializePageFunctionality() {
        function renderCards(membersToRender, container) {
            const membersHTML = membersToRender.map(member => createMemberCardHTML(member)).join('');
            container.innerHTML = membersHTML;
        }

        function updateView() {
            const filterText = searchInput.value.toLowerCase();
                    
            if (filterText) {
                // Filter all members (including leaders) based on the search input
                const combinedMembers = allMembersData;
                filteredMembers = combinedMembers.filter(member =>
                    member.name.toLowerCase().includes(filterText) ||
                    (member.role && member.role.toLowerCase().includes(filterText))
                );
                
                // Render all search results in the main members grid
                renderCards(filteredMembers, membersGrid);
                
                // Hide leader section and pagination
                leaderGrid.innerHTML = '';
                leaderSection.style.display = 'none';
                paginationControls.style.display = 'none';

            } else {
                filteredMembers = allMembersData.filter(m => m.role === 'Member');
                
                if (currentPage === 1) {
                    renderCards(leadersData, leaderGrid);
                    leaderSection.style.display = leadersData.length > 0 ? 'block' : 'none';
                } else {
                    leaderGrid.innerHTML = '';
                    leaderSection.style.display = 'none';
                }

                const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
                if (totalPages > 0 && currentPage > totalPages) {
                    currentPage = totalPages;
                }
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const membersToDisplay = filteredMembers.slice(startIndex, endIndex);

                renderCards(membersToDisplay, membersGrid);
                        
                if (totalPages > 1) {
                    paginationControls.style.display = 'flex';
                    pageInfo.textContent = `หน้า ${currentPage} จาก ${totalPages}`;
                    prevBtn.disabled = (currentPage === 1);
                    nextBtn.disabled = (currentPage === totalPages);
                } else {
                    paginationControls.style.display = 'none';
                }
            }
            revealElements();
        }
        
        searchInput.addEventListener('keyup', () => { 
            currentPage = 1; 
            updateView(); 
        });
        nextBtn.addEventListener('click', () => { 
            currentPage++; 
            updateView(); 
        });
        prevBtn.addEventListener('click', () => { 
            currentPage--; 
            updateView(); 
        });
        
        updateView();

        const audio = document.getElementById('gang-music');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const playIcon = playPauseBtn.querySelector('i');
        const muteBtn = document.getElementById('mute-btn');
        const muteIcon = muteBtn.querySelector('i');
        const volumeSlider = document.getElementById('volume-slider');

        playPauseBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().catch(error => console.error("Play failed:", error));
            } else {
                audio.pause();
            }
        });
        
        audio.addEventListener('play', () => {
            playIcon.classList.remove('fa-play');
            playIcon.classList.add('fa-pause');
        });
        audio.addEventListener('pause', () => {
            playIcon.classList.remove('fa-pause');
            playIcon.classList.add('fa-play');
        });

        volumeSlider.addEventListener('input', (e) => {
            audio.volume = e.target.value;
            audio.muted = false;
        });

        audio.addEventListener('volumechange', () => {
            if (audio.muted || audio.volume === 0) {
                muteIcon.classList.remove('fa-volume-high', 'fa-volume-low');
                muteIcon.classList.add('fa-volume-xmark');
                volumeSlider.value = 0;
            } else if (audio.volume < 0.5) {
                muteIcon.classList.remove('fa-volume-high', 'fa-volume-xmark');
                muteIcon.classList.add('fa-volume-low');
                volumeSlider.value = audio.volume;
            } else {
                muteIcon.classList.remove('fa-volume-low', 'fa-volume-xmark');
                muteIcon.classList.add('fa-volume-high');
                volumeSlider.value = audio.volume;
            }
        });
        
        muteBtn.addEventListener('click', () => {
            audio.muted = !audio.muted;
        });
    }

    enterBtn.addEventListener('click', () => {
        landingPage.style.display = 'none';
        membersPage.style.display = 'block';
        audioPlayerContainer.style.display = 'flex';
        backToLandingBtn.style.display = 'flex';
        
        currentPage = 1;
        searchInput.value = '';
        
        const audio = document.getElementById('gang-music');
        audio.volume = 0.1;
        audio.play().then(() => {
            const playIcon = document.querySelector('#play-pause-btn i');
            playIcon.classList.remove('fa-play');
            playIcon.classList.add('fa-pause');
        }).catch(error => { 
            console.error("Autoplay was prevented:", error); 
        });
        
        fetchAndDisplayMembers();
    });

    backToLandingBtn.addEventListener('click', () => {
        // การแก้ไข: ใช้ window.location.reload() เพื่อรีโหลดหน้าเว็บทั้งหมด
        window.location.reload();
    });

    if (window.location.hash === '#members') {
        landingPage.style.display = 'none';
        membersPage.style.display = 'block';
        audioPlayerContainer.style.display = 'flex';
        backToLandingBtn.style.display = 'flex';
        fetchAndDisplayMembers();
    }
});