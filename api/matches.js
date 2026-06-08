const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY;

export default async function handler(req, res) {
    const { action } = req.query;
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

    try {
        if (action === 'getMatches') {
            const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
                headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY }
            });

            if (!response.ok) throw new Error('Limite da API atingido ou erro de servidor.');
            const data = await response.json();
            return res.status(200).json(data);
        }
        return res.status(400).json({ error: 'Ação inválida' });
    } catch (err) {
        console.warn("Utilizando Fallback estável do openfootball via GitHub");

        const fallback = await fetch('https://raw.githubusercontent.com/openfootball/world-cup/master/2026/cup.json');
        const dadosFallback = await fallback.json();

        return res.status(200).json({
            source: "openfootball_fallback",
            matches: dadosFallback.rounds ? dadosFallback.rounds.flatMap(r => r.matches) : []
        });
    }
}
