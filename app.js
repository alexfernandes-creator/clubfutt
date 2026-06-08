const SUPABASE_URL = "https://zfimvfcvmdamvjjkladaf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmaW12ZmN2bWRhbXZqamtsZGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTkyNjUsImV4cCI6MjA5NTUzNTI2NX0.mG3aYG20ArpoXYdQ-MwlfHRm6gzgKdgJFAgJ9KmEeZM";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const STRIPE_PUBLISHABLE_KEY = "SUA_CHAVE_PUBLICAVEL_DO_STRIPE_AQUI";

document.getElementById('auth-btn').addEventListener('click', async () => {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    if (error) console.error('Erro ao logar:', error.message);
});

supabaseClient.auth.onAuthStateChange((event, session) => {
    const btn = document.getElementById('auth-btn');
    if (session) {
        btn.textContent = `Olá, ${session.user.user_metadata.full_name || 'Fã'}`;
        btn.onclick = () => supabaseClient.auth.signOut();
    } else {
        btn.textContent = localStorage.getItem('clubfutt_lang') === 'en' ? 'Login with Google' : 'Entrar com Google';
    }
});

// 🌍 SISTEMA GLOBAL DE IDIOMAS (i18n)
let idiomaAtual = localStorage.getItem('clubfutt_lang') || 'pt';

const dicionario = {
    pt: {
        tab_jogos: "⚽ Ao Vivo & Partidas",
        tab_tabelas: "📊 Classificação",
        tab_pro: "👑 Central Analítica HUD Pro",
        btn_desbloquear: "Desbloquear HUD Pro por R$ 54,89/mês",
        live_badge: "● LIVE GLOBAL",
        coming_soon_title: "Dados em Tempo Real 2026",
        coming_soon_desc: "Esta liga está sendo integrada aos nossos servidores de alta velocidade. Disponível muito em breve para assinantes!",
        sync_radar: "Sincronizando Radar Global",
        sync_radar_desc: "O mapeamento de partidas em tempo real está sendo calibrado com os satélites parceiros. Ativação em breve!"
    },
    en: {
        tab_jogos: "⚽ Live & Matches",
        tab_tabelas: "📊 Standings",
        tab_pro: "👑 HUD Pro Analytics Center",
        btn_desbloquear: "Unlock HUD Pro for $9.99/month",
        live_badge: "● GLOBAL LIVE",
        coming_soon_title: "Real-Time Data 2026",
        coming_soon_desc: "This league is being integrated into our high-speed servers. Available very soon for subscribers!",
        sync_radar: "Synchronizing Global Radar",
        sync_radar_desc: "Real-time match mapping is being calibrated with partner satellites. Activation coming soon!"
    }
};

function aplicarTraducoes() {
    document.querySelectorAll('[data-i18n]').forEach(elemento => {
        const chave = elemento.getAttribute('data-i18n');
        if (dicionario[idiomaAtual][chave]) {
            elemento.innerHTML = dicionario[idiomaAtual][chave];
        }
    });
    document.getElementById('select-idioma').value = idiomaAtual;
}

function mudarIdioma(novoIdioma) {
    idiomaAtual = novoIdioma;
    localStorage.setItem('clubfutt_lang', novoIdioma);
    aplicarTraducoes();
    carregarPartidas();
    document.getElementById('auth-btn').textContent =
        novoIdioma === 'en' ? 'Login with Google' : 'Entrar com Google';
}

// Abas
function alternarAba(abaId) {
    document.querySelectorAll('.hud-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.hud-panel').forEach(p => p.classList.remove('active'));
    document.querySelector(`[onclick="alternarAba('${abaId}')"]`).classList.add('active');
    document.getElementById(abaId).classList.add('active');
}

// 💳 DISPARADOR DE PAGAMENTO INTELIGENTE
function dispararCheckoutIdomaAtual() {
    const moeda = idiomaAtual === 'pt' ? 'brl' : 'usd';
    abrirCheckoutTransparente(moeda);
}

async function abrirCheckoutTransparente(moeda) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const userId = session?.user?.id || 'anon';

    const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: moeda, userId })
    });
    const checkoutData = await res.json();

    if (checkoutData.clientSecret) {
        const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        const { error } = await stripe.initEmbeddedCheckout({
            clientSecret: checkoutData.clientSecret
        });
        if (error) console.error('Stripe Checkout error:', error.message);
    } else {
        console.error('Erro ao gerar checkout:', checkoutData.error);
    }
}

async function carregarPartidas() {
    try {
        const res = await fetch('/api/matches?action=getMatches');
        const dados = await res.json();

        const grid = document.getElementById('matches-grid');
        grid.innerHTML = '';

        const partidas = dados.matches || dados.data?.matches || obterPartidasSimuladas();

        partidas.slice(0, 8).forEach(jogo => {
            const card = document.createElement('div');
            card.className = 'match-card';
            card.innerHTML = `
                <div class="match-teams">
                    <div class="team">
                        <img src="${jogo.homeTeam?.crest || 'https://crests.football-data.org/764.svg'}" onerror="this.src='https://via.placeholder.com/30'">
                        <span>${jogo.homeTeam?.tla || jogo.homeTeam?.name || 'TBD'}</span>
                    </div>
                    <div class="score">${jogo.score?.fullTime?.home ?? '-'}</div>
                </div>
                <div class="match-teams">
                    <div class="team">
                        <img src="${jogo.awayTeam?.crest || 'https://crests.football-data.org/773.svg'}" onerror="this.src='https://via.placeholder.com/30'">
                        <span>${jogo.awayTeam?.tla || jogo.awayTeam?.name || 'TBD'}</span>
                    </div>
                    <div class="score">${jogo.score?.fullTime?.away ?? '-'}</div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error("Erro geral na renderização:", err);
    }
}

function obterPartidasSimuladas() {
    return [
        { homeTeam: { name: "Brasil", tla: "BRA" }, awayTeam: { name: "França", tla: "FRA" }, score: { fullTime: { home: 2, away: 1 } } },
        { homeTeam: { name: "Argentina", tla: "ARG" }, awayTeam: { name: "Espanha", tla: "ESP" }, score: { fullTime: { home: 0, away: 0 } } }
    ];
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarTraducoes();
    carregarPartidas();
});
