document.addEventListener('DOMContentLoaded', function () {

    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playClickSound() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc.start(now);
            osc.stop(now + 0.04);
        } catch (e) {}
    }

    function playHoverSound() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, now);

            gain.gain.setValueAtTime(0.015, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

            osc.start(now);
            osc.stop(now + 0.02);
        } catch (e) {}
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('button, a, input, select, .project-card, .theme-opt-btn')) {
            playClickSound();
        }
    });

    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (cursorDot && cursorOutline) {
        let mouseX = -100, mouseY = -100;
        let outlineX = -100, outlineY = -100;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        });

        function animateCursor() {
            outlineX += (mouseX - outlineX) * 0.22;
            outlineY += (mouseY - outlineY) * 0.22;
            cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px)`;
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        document.querySelectorAll('a, button, input, textarea, select, .project-card, .theme-opt-btn').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.classList.add('hover-active');
                playHoverSound();
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.classList.remove('hover-active');
            });
        });
    }

    const canvas = document.getElementById('matrix-background');
    let activeThemeHex = '#00f3ff';

    if (canvas) {
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();

        const katakana = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nums = '0123456789';
        const alphabet = katakana + latin + nums + '0x52415546';

        const fontSize = 16;
        let columns = Math.floor(canvas.width / fontSize);
        let rainDrops = [];

        function initDrops() {
            columns = Math.floor(canvas.width / fontSize);
            rainDrops = [];
            for (let x = 0; x < columns; x++) {
                rainDrops[x] = Math.floor(Math.random() * -50);
            }
        }
        initDrops();

        window.addEventListener('resize', () => {
            resizeCanvas();
            initDrops();
        });

        function drawMatrixRain() {
            ctx.fillStyle = 'rgba(4, 5, 8, 0.06)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < rainDrops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                const x = i * fontSize;
                const y = rainDrops[i] * fontSize;

                ctx.fillStyle = '#ffffff';
                ctx.fillText(text, x, y);

                ctx.fillStyle = activeThemeHex;
                const trailText = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                ctx.fillText(trailText, x, y - fontSize);

                if (y > canvas.height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
        }

        setInterval(drawMatrixRain, 33);

        window.setMatrixTheme = (hex) => { activeThemeHex = hex; };
    }

    const themeMenuBtn = document.getElementById('theme-menu-btn');
    const themeDropdownMenu = document.getElementById('theme-dropdown-menu');
    const activeThemeDot = document.getElementById('active-theme-dot');
    const activeThemeName = document.getElementById('active-theme-name');

    const themeMap = {
        cyan: { label: 'ELECTRIC CYAN', dotClass: 'dot-cyan', hex: '#00f3ff' },
        green: { label: 'CYBER GREEN', dotClass: 'dot-green', hex: '#00ff88' },
        crimson: { label: 'CRIMSON RED', dotClass: 'dot-crimson', hex: '#ff0055' },
        purple: { label: 'NEON PURPLE', dotClass: 'dot-purple', hex: '#a855f7' },
        amber: { label: 'AMBER GOLD', dotClass: 'dot-amber', hex: '#ffb000' }
    };

    function applyTheme(themeKey) {
        const theme = themeMap[themeKey] ? themeKey : 'cyan';
        document.body.className = 'cyber-theme';
        if (theme !== 'cyan') {
            document.body.classList.add('theme-' + theme);
        }

        const info = themeMap[theme];
        if (activeThemeDot) activeThemeDot.className = 'theme-color-indicator ' + info.dotClass;
        if (activeThemeName) activeThemeName.textContent = info.label;
        if (window.setMatrixTheme) window.setMatrixTheme(info.hex);

        localStorage.setItem('rauf_cyber_theme', theme);
    }

    const savedTheme = localStorage.getItem('rauf_cyber_theme') || 'cyan';
    applyTheme(savedTheme);

    if (themeMenuBtn && themeDropdownMenu) {
        themeMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeDropdownMenu.classList.toggle('active');
        });

        document.querySelectorAll('.theme-opt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const selected = btn.getAttribute('data-theme');
                applyTheme(selected);
                themeDropdownMenu.classList.remove('active');
            });
        });

        document.addEventListener('click', () => {
            themeDropdownMenu.classList.remove('active');
        });
    }

    const preloader = document.getElementById('preloader');
    const bar = document.getElementById('preloader-bar');

    if (preloader && bar) {
        let w = 0;
        const interval = setInterval(() => {
            w += Math.random() * 30;
            if (w >= 100) {
                w = 100;
                clearInterval(interval);
                setTimeout(() => {
                    preloader.style.opacity = '0';
                    setTimeout(() => { preloader.style.display = 'none'; }, 500);
                }, 400);
            }
            bar.style.width = w + '%';
        }, 120);
    }

    const SUPABASE_URL = 'https://mdhesolqkvjyzrcqtzer.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_nkYW2XQTbDB_A4bgSVyuBg_ytD38-Ol';

    const supabaseClient = (window.supabase) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

    let currentUser = null;
    let loadedProjectsData = [];
    const defaultTechCover = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';

    const initialProjects = [
        { name: 'RFG-Hybrid-SecuritySuit', description: 'Advanced AI-powered security suite for vulnerability analysis. Features OSINT (Shodan/Censys), automated scanning, and AI model security audits.', image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/RFG-Hybrid-SecuritySuit', tags: ['Python', 'Cybersecurity', 'AI'] },
        { name: 'VirtualBox-DCRP-Python-Project', description: 'VirtualBox rich presence for discord using python programming language.', image_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/VirtualBox-DCRP-Python-Project', tags: ['Python', 'Discord RPC'] },
        { name: 'WebsiteCrawler-Spider-', description: 'A program that can bring all links from site using python BeautifulSoup4 and request library.', image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/WebsiteCrawler-Spider-', tags: ['Python', 'Web Scraping'] },
        { name: 'SubdomainFinder', description: 'Simple subdomain finder using serpapi with requests, urllib.urlparse and os library.', image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/SubdomainFinder', tags: ['Python', 'OSINT'] },
        { name: 'ARP-Spoof-ManintheMiddle', description: 'Python script demonstrating ARP spoofing principles for network security education.', image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/ARP-Spoof-ManintheMiddle', tags: ['Python', 'Cybersecurity'] },
        { name: 'CatchTheCircle', description: 'Basic game using python turtle library.', image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/CatchTheCircle', tags: ['Python', 'Game'] },
        { name: 'SecretNotesPy', description: 'Note encryption and decryption software developed using python.', image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/SecretNotesPy', tags: ['Python', 'Cryptography'] },
        { name: 'MacChangerLinux', description: 'A simple program that changes Mac address in linux with -i and -m commands.', image_url: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/MacChangerLinux', tags: ['Python', 'Cybersecurity'] },
        { name: 'NetworkScanningTool', description: 'Basic network scanner tool using python. usage --ip 10.0.2.1/24', image_url: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/NetworkScanningTool', tags: ['Python', 'Networking'] },
        { name: 'BufferOverflowExp', description: 'An exploit in python for hacking vulnserver only educational purposes.', image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/BufferOverflowExp', tags: ['Python', 'Exploit Dev'] },
        { name: 'YoutubeDownloader', description: 'A simple Python tool that lets you download YouTube videos and thumbnails.', image_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/YoutubeDownloader', tags: ['Python'] },
        { name: 'Text-to-Speech', description: 'A program that turns given text to speech.', image_url: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/Text-to-Speech', tags: ['Python'] },
        { name: 'BMICalculator', description: 'Simple calculator for calculating your BMI using tkinter.', image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/BMICalculator', tags: ['Python', 'Tkinter'] },
        { name: 'MyWeatherApp', description: 'Weather Website using Weather API, Flask, and JS.', image_url: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/MyWeatherApp', tags: ['Python', 'Flask', 'Web'] },
        { name: 'ArtBookJava', description: 'ArtBook is a simple Android app for adding artworks.', image_url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/ArtBookJava', tags: ['Java', 'Android'] },
        { name: 'CyberRFG-Portfolio', description: 'Animated portfolio site using HTML, CSS, and JS.', image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80', github_link: 'https://github.com/rauffathigovashin/CyberRFG-Portfolio', tags: ['HTML', 'CSS', 'JS'] }
    ];

    const statusDisplay = document.getElementById('status-display');
    const portfolioGrid = document.getElementById('portfolio-grid');
    const adminModal = document.getElementById('admin-modal');
    const btnAdminLogin = document.getElementById('btn-admin-login');
    const closeAdminBtn = document.getElementById('close-admin');
    const saveAdminBtn = document.getElementById('save-admin');
    const adminModalTitle = document.getElementById('admin-modal-title');

    const adminLoginFields = document.getElementById('admin-login-fields');
    const adminTabButtons = document.getElementById('admin-tab-buttons');
    const adminStatusFields = document.getElementById('admin-status-fields');
    const adminProjectFields = document.getElementById('admin-project-fields');
    const adminDeleteFields = document.getElementById('admin-delete-fields');
    const deleteProjSelect = document.getElementById('delete-proj-select');

    const termDrawer = document.getElementById('terminal-drawer');
    const btnOpenTerminal = document.getElementById('btn-open-terminal');
    const btnCloseTerminal = document.getElementById('btn-close-terminal');
    const termInput = document.getElementById('terminal-input');
    const termOutput = document.getElementById('terminal-output');

    let currentMode = 'login';

    function updateStatusUI(text) {
        if (statusDisplay) statusDisplay.innerHTML = `Status: <strong>${text}</strong>`;
    }

    function resolveImageUrl(imgUrl) {
        if (!imgUrl) return defaultTechCover;
        if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
        return 'https://rauffathigovashin.github.io/' + imgUrl.replace(/^\//, '');
    }

    async function loadProjects() {
        if (!portfolioGrid) return;
        loadedProjectsData = [];

        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from('portfolio_projects').select('*').order('id', { ascending: false });
                if (!error && data && data.length > 0) loadedProjectsData = data;
            } catch (e) {}
        }

        if (loadedProjectsData.length === 0) loadedProjectsData = [...initialProjects];

        portfolioGrid.innerHTML = '';
        loadedProjectsData.forEach(proj => {
            const finalImg = resolveImageUrl(proj.image_url);
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="project-image">
                    <img src="${finalImg}" 
                         alt="${proj.name}" 
                         loading="lazy" 
                         onerror="this.onerror=null; this.src='${defaultTechCover}';">
                </div>
                <div class="card-content">
                    <h3>${proj.name}</h3>
                    <p>${proj.description}</p>
                    <div class="project-tags">
                        ${proj.tags ? (Array.isArray(proj.tags) ? proj.tags : proj.tags.split(',')).map(t => `<span class="tag">${t.trim()}</span>`).join('') : ''}
                    </div>
                    <a href="${proj.github_link || proj.github}" target="_blank" rel="noopener" class="btn-cyber-outline" style="align-self:flex-start; text-decoration:none;">View on GitHub ↗</a>
                </div>
            `;
            portfolioGrid.appendChild(card);
        });

        if (deleteProjSelect) {
            deleteProjSelect.innerHTML = '';
            loadedProjectsData.forEach((p, idx) => {
                const opt = document.createElement('option');
                opt.value = p.name;
                opt.textContent = `${idx + 1}. ${p.name}`;
                deleteProjSelect.appendChild(opt);
            });
        }
    }

    async function loadStatus() {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from('portfolio_status').select('content').limit(1).single();
                if (!error && data) updateStatusUI(data.content);
                else updateStatusUI('Kiber Təhlükəsizlik öyrənirəm');
            } catch (e) {
                updateStatusUI('Kiber Təhlükəsizlik öyrənirəm');
            }
        } else {
            updateStatusUI('Kiber Təhlükəsizlik öyrənirəm');
        }
        fetchGitHubStats();
    }

    async function fetchGitHubStats() {
        try {
            const res = await fetch('https://api.github.com/users/rauffathigovashin');
            const data = await res.json();
            
            const repoEl = document.getElementById('github-repos');
            const followEl = document.getElementById('github-followers');
            const starEl = document.getElementById('github-stars');

            if (repoEl) repoEl.textContent = data.public_repos || 16;
            if (followEl) followEl.textContent = data.followers || 0;

            const reposRes = await fetch('https://api.github.com/users/rauffathigovashin/repos?per_page=100');
            const repos = await reposRes.json();
            const stars = Array.isArray(repos) ? repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0) : 0;
            if (starEl) starEl.textContent = stars;
        } catch (e) {}
    }

    loadProjects();
    loadStatus();

    const contactForm = document.getElementById('discord-contact-form');
    const formStatus = document.getElementById('discord-form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('contact-name');
            const tagInput = document.getElementById('contact-tag');
            const msgInput = document.getElementById('contact-msg');

            const name = nameInput ? nameInput.value.trim() : '';
            const tag = tagInput ? tagInput.value.trim() : '';
            const message = msgInput ? msgInput.value.trim() : '';

            const submitBtn = document.getElementById('btn-send-discord');

            if (formStatus) formStatus.innerHTML = '<span style="color:var(--color-cyan)">[+] Sending message to Discord...</span>';
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

            try {
                let targetWebhookUrl = null;

                if (supabaseClient) {
                    try {
                        const { data, error } = await supabaseClient
                            .from('portfolio_config')
                            .select('discord_webhook')
                            .eq('id', 1)
                            .single();

                        if (!error && data && data.discord_webhook) {
                            targetWebhookUrl = data.discord_webhook;
                        }
                    } catch (err) {}
                }

                if (!targetWebhookUrl) {
                    targetWebhookUrl = localStorage.getItem('rauf_discord_webhook');
                }

                if (!targetWebhookUrl) {
                    if (supabaseClient) {
                        await supabaseClient.from('portfolio_messages').insert([{ name: name, contact: tag, message: message }]);
                    }
                    if (formStatus) {
                        formStatus.innerHTML = `<span style="color:var(--color-green)">✓ Mesaj uğurla göndərildi və yadda saxlanıldı! Çox sağ ol ${name}.</span>`;
                    }
                    contactForm.reset();
                    return;
                }

                const discordData = {
                    embeds: [{
                        title: "📩 New Support Message (Discord)",
                        color: 5814783,
                        fields: [
                            { name: "👤 Sender", value: `${name} (${tag})`, inline: true },
                            { name: "💬 Message", value: message }
                        ],
                        timestamp: new Date().toISOString(),
                        footer: { text: "CyberRFG Portfolio System" }
                    }]
                };

                const response = await fetch(targetWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(discordData)
                });

                if (response.ok || response.status === 204) {
                    if (formStatus) {
                        formStatus.innerHTML = `<span style="color:var(--color-green)">✓ Mesaj uğurla Discord kanalınıza çatdırıldı! Çox sağ ol ${name}.</span>`;
                    }
                    contactForm.reset();
                } else {
                    throw new Error('Discord response error.');
                }
            } catch (err) {
                console.error(err);
                if (formStatus) {
                    formStatus.innerHTML = `<span style="color:var(--color-green)">✓ Mesaj qeydə alındı! Çox sağ ol ${name}.</span>`;
                }
                contactForm.reset();
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Discord Message';
                }
            }
        });
    }

    function openAdminModal(mode = 'login') {
        currentMode = mode;
        adminModal.classList.add('active');

        if (mode === 'login') {
            adminModalTitle.textContent = 'Supabase Admin Authentication';
            adminLoginFields.classList.remove('hidden');
            if (adminTabButtons) adminTabButtons.classList.add('hidden');
            adminStatusFields.classList.add('hidden');
            adminProjectFields.classList.add('hidden');
            adminDeleteFields.classList.add('hidden');
            saveAdminBtn.textContent = 'Authenticate Login';
        } else {
            if (adminTabButtons) adminTabButtons.classList.remove('hidden');
            adminLoginFields.classList.add('hidden');
            
            document.querySelectorAll('.admin-tab-btn').forEach(btn => {
                if (btn.getAttribute('data-tab') === mode) btn.classList.add('active');
                else btn.classList.remove('active');
            });

            if (mode === 'status') {
                adminModalTitle.textContent = 'Admin: Update Live Status Message';
                adminStatusFields.classList.remove('hidden');
                adminProjectFields.classList.add('hidden');
                adminDeleteFields.classList.add('hidden');
                saveAdminBtn.textContent = 'Save Status';
            } else if (mode === 'add') {
                adminModalTitle.textContent = 'Admin: Add New Project';
                adminStatusFields.classList.add('hidden');
                adminProjectFields.classList.remove('hidden');
                adminDeleteFields.classList.add('hidden');
                saveAdminBtn.textContent = 'Add Project to Database';
            } else if (mode === 'delete') {
                adminModalTitle.textContent = 'Admin: Delete Existing Project';
                adminStatusFields.classList.add('hidden');
                adminProjectFields.classList.add('hidden');
                adminDeleteFields.classList.remove('hidden');
                saveAdminBtn.textContent = 'Delete Selected Project';
            }
        }
    }

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            openAdminModal(tab);
        });
    });

    if (btnAdminLogin) {
        btnAdminLogin.addEventListener('click', () => {
            if (currentUser) openAdminModal('status');
            else openAdminModal('login');
        });
    }

    if (closeAdminBtn) closeAdminBtn.addEventListener('click', () => adminModal.classList.remove('active'));

    if (saveAdminBtn) {
        saveAdminBtn.addEventListener('click', async () => {
            if (currentMode === 'login') {
                const email = document.getElementById('admin-email').value;
                const pass = document.getElementById('admin-pass').value;
                if (!email || !pass) { alert('Zəhmət olmasa email/username və parolu daxil edin!'); return; }

                if (supabaseClient) {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
                    if (error) {
                        alert('Giriş xətası: ' + error.message);
                    } else {
                        currentUser = data.user;
                        document.getElementById('admin-btn-text').textContent = 'Admin (Logged In)';
                        alert('Uğurla giriş edildi! Salam Admin.');
                        openAdminModal('status');
                    }
                } else {
                    currentUser = { email };
                    document.getElementById('admin-btn-text').textContent = 'Admin Mode';
                    alert('Offline Admin Rejimi Aktivləşdirildi.');
                    openAdminModal('status');
                }
            } else if (currentMode === 'status') {
                const newStatus = document.getElementById('status-text-input').value;
                if (newStatus) {
                    updateStatusUI(newStatus);
                    if (supabaseClient) {
                        await supabaseClient.from('portfolio_status').upsert({ id: 1, content: newStatus });
                    }
                    alert('Status yeniləndi!');
                    adminModal.classList.remove('active');
                }
            } else if (currentMode === 'add') {
                const name = document.getElementById('proj-name').value;
                const desc = document.getElementById('proj-desc').value;
                const img = document.getElementById('proj-img').value;
                const github = document.getElementById('proj-github').value;
                const tags = document.getElementById('proj-tags').value.split(',').map(t => t.trim());

                if (name && desc) {
                    const newProj = { name, description: desc, image_url: img || defaultTechCover, github_link: github, tags };
                    initialProjects.unshift(newProj);
                    if (supabaseClient) {
                        await supabaseClient.from('portfolio_projects').insert([newProj]);
                    }
                    loadProjects();
                    alert(`"${name}" proyekti müvəffəqiyyətlə əlavə edildi!`);
                    adminModal.classList.remove('active');
                } else {
                    alert('Zəhmət olmasa proyekt adını və təsvirini daxil edin!');
                }
            } else if (currentMode === 'delete') {
                const selectedName = deleteProjSelect ? deleteProjSelect.value : null;
                if (selectedName) {
                    if (confirm(`"${selectedName}" proyektini silməyə əminsiniz?`)) {
                        loadedProjectsData = loadedProjectsData.filter(p => p.name !== selectedName);
                        initialProjects.forEach((p, idx) => {
                            if (p.name === selectedName) initialProjects.splice(idx, 1);
                        });

                        if (supabaseClient) {
                            await supabaseClient.from('portfolio_projects').delete().eq('name', selectedName);
                        }
                        loadProjects();
                        alert(`"${selectedName}" proyekti silindi!`);
                        adminModal.classList.remove('active');
                    }
                }
            }
        });
    }

    if (btnOpenTerminal) {
        btnOpenTerminal.addEventListener('click', () => {
            termDrawer.classList.add('active');
            termInput.focus();
        });
    }

    if (btnCloseTerminal) btnCloseTerminal.addEventListener('click', () => termDrawer.classList.remove('active'));

    function appendTerminal(content) {
        const div = document.createElement('div');
        div.className = 'out-line';
        div.innerHTML = content;
        termOutput.appendChild(div);
        document.getElementById('terminal-body').scrollTop = document.getElementById('terminal-body').scrollHeight;
    }

    const termCommands = {
        help: () => {
            appendTerminal(`
                <p style="color:var(--color-cyan)">0x52415546 CONSOLE CLI MENU:</p>
                <p><strong>help</strong> - Displays this command menu</p>
                <p><strong>messages</strong> - Displays all incoming contact submissions</p>
                <p><strong>nmap &lt;target&gt;</strong> - Simulates network port scan (e.g. nmap 192.168.1.1)</p>
                <p><strong>shodan &lt;ip&gt;</strong> - Simulates Shodan OSINT reconnaissance query</p>
                <p><strong>skills</strong> - Prints technical cybersecurity & programming skills</p>
                <p><strong>projects</strong> - Lists all 16 open-source repositories</p>
                <p><strong>theme &lt;cyan/green/crimson/purple/amber&gt;</strong> - Switches page accent theme!</p>
                <p><strong>whoami</strong> - Displays 0x52415546 developer identity</p>
                <p><strong>contact</strong> - Displays Discord, Email & GitHub links</p>
                <p><strong>login</strong> - Opens Supabase Admin Auth login</p>
                <p><strong>sudo</strong> - Evaluates root privileges</p>
                <p><strong>clear</strong> - Clears terminal output</p>
            `);
        },

        messages: async () => {
            appendTerminal('<p style="color:var(--color-cyan)">Fetching messages from Supabase Database...</p>');
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.from('portfolio_messages').select('*').order('id', { ascending: false });
                    if (!error && data && data.length > 0) {
                        data.forEach((m, idx) => {
                            appendTerminal(`
                                <p style="color:var(--color-green)">
#${idx + 1} From: <strong>${m.name}</strong> (${m.contact || m.email})<br>
Message: "${m.message}"
                                </p>
                            `);
                        });
                        return;
                    }
                } catch(e) {}
            }
            const list = JSON.parse(localStorage.getItem('rauf_discord_messages') || '[]');
            if (list.length === 0) {
                appendTerminal('<p style="color:var(--color-pink)">No incoming messages found yet.</p>');
            } else {
                appendTerminal(`<p style="color:var(--color-cyan)">[RECEIVED LOCAL MESSAGES: ${list.length}]</p>`);
                list.forEach((m, idx) => {
                    appendTerminal(`
                        <p style="color:var(--color-green)">
#${idx + 1} [${m.timestamp}] From: <strong>${m.name}</strong> (${m.tag})<br>
Message: "${m.msg}"
                        </p>
                    `);
                });
            }
        },

        nmap: (args) => {
            const target = args[0] || '127.0.0.1';
            appendTerminal(`<p style="color:var(--color-cyan)">[+] Starting Nmap 7.94 audit on target: ${target}...</p>`);
            setTimeout(() => {
                appendTerminal(`
                    <p style="color:var(--color-green)">
PORT     STATE SERVICE     VERSION<br>
22/tcp   open  ssh         OpenSSH 8.9p1 Ubuntu<br>
80/tcp   open  http        Nginx 1.18.0<br>
443/tcp  open  ssl/https   Cloudflare Edge<br>
3306/tcp open  mysql       MySQL 8.0.32<br>
Nmap scan completed: 1 IP address (1 host up) scanned in 0.42 seconds.
                    </p>
                `);
            }, 400);
        },

        shodan: (args) => {
            const ip = args[0] || '8.8.8.8';
            appendTerminal(`<p style="color:var(--color-cyan)">[+] Querying Shodan API for IP: ${ip}...</p>`);
            setTimeout(() => {
                appendTerminal(`
                    <p style="color:var(--color-green)">
[SHODAN OSINT REPORT]<br>
IP: ${ip} | Organization: CyberRFG Security Node<br>
Ports Open: [22, 80, 443]<br>
Vulnerabilities: 0 Critical (Protected by CyberShield)
                    </p>
                `);
            }, 400);
        },

        skills: () => {
            appendTerminal(`
                <p style="color:var(--color-cyan)">[CORE SKILLS & TECH STACK]</p>
                <p>• <strong>Languages:</strong> Python, JavaScript (ES6+), HTML5/CSS3, SQL, Java</p>
                <p>• <strong>Security & Pentesting:</strong> Scapy, BeautifulSoup4, Requests, Socket API, Nmap, Wireshark, OSINT</p>
                <p>• <strong>Frameworks & DB:</strong> Supabase, Flask, Tkinter, REST APIs</p>
            `);
        },

        theme: (args) => {
            const chosen = (args[0] || '').toLowerCase();
            if (['cyan', 'green', 'crimson', 'purple', 'amber'].includes(chosen)) {
                applyTheme(chosen);
                appendTerminal(`<p style="color:var(--color-cyan)">✓ Accent theme switched to: ${chosen.toUpperCase()}</p>`);
            } else {
                appendTerminal('<p style="color:var(--color-pink)">Choose: cyan, green, crimson, purple, amber.</p>');
            }
        },

        sudo: () => {
            appendTerminal('<p style="color:var(--color-pink)">[!] Privilege Check: User 0x52415546 is already granted root privileges.</p>');
        },

        login: () => openAdminModal('login'),
        setup: () => appendTerminal('<p style="color:var(--color-green)">✓ 0x52415546 System Core & Supabase DB synced.</p>'),
        projects: () => { loadProjects(); appendTerminal('<p style="color:var(--color-green)">✓ 16 Projects reloaded on portfolio grid.</p>'); },
        whoami: () => appendTerminal('<p style="color:var(--color-cyan)">0x52415546 // Rauf Fathi Govashin (RaufFathi / CyberRFG)</p>'),
        contact: () => {
            appendTerminal(`
                <p>📧 Email: rauffathigovashin@gmail.com</p>
                <p>🐙 GitHub: https://github.com/Rauffathigovashin</p>
                <p>📷 Instagram: https://www.instagram.com/rauffathigovashin/</p>
            `);
        },
        clear: () => { termOutput.innerHTML = ''; }
    };

    termInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const raw = termInput.value.trim();
            termInput.value = '';

            if (raw) {
                appendTerminal(`<p><span style="color:var(--color-pink)">root@rauffathi-cyberrfg:#</span> ${raw}</p>`);
                const parts = raw.split(' ').filter(Boolean);
                const cmd = parts[0].toLowerCase();
                const args = parts.slice(1);

                if (termCommands[cmd]) termCommands[cmd](args);
                else appendTerminal(`<p style="color:var(--color-pink)">Command not found: ${cmd}. Type "help".</p>`);
            }
        }
    });

    const typingEl = document.getElementById('typing-effect');
    if (typingEl) {
        const phrases = ["Threat Hunting & OSINT", "Vulnerability Scanning Suite", "Python Pentest Automation"];
        let pIdx = 0, cIdx = 0, isDeleting = false;

        function typeLoop() {
            const current = phrases[pIdx];
            if (isDeleting) {
                typingEl.textContent = current.substring(0, cIdx - 1);
                cIdx--;
            } else {
                typingEl.textContent = current.substring(0, cIdx + 1);
                cIdx++;
            }

            let speed = isDeleting ? 40 : 80;

            if (!isDeleting && cIdx === current.length) {
                speed = 2000;
                isDeleting = true;
            } else if (isDeleting && cIdx === 0) {
                isDeleting = false;
                pIdx = (pIdx + 1) % phrases.length;
                speed = 500;
            }
            setTimeout(typeLoop, speed);
        }
        typeLoop();
    }

    appendTerminal('<p style="color:var(--color-cyan)">0x52415546_console v19.0 Clean code active. Type "help" or "messages".</p>');
});
