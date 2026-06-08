const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { currency } = req.body;

    const checkoutLocale = currency === 'brl' ? 'pt-BR' : 'en';

    const priceId = currency === 'brl' ? process.env.STRIPE_PRICE_BRL : process.env.STRIPE_PRICE_USD;

    try {
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            payment_method_types: ['card'],
            locale: checkoutLocale,
            return_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}`,
        });

        res.status(200).json({ clientSecret: session.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
