// ALL prices are in KES and INCLUDE 16% VAT. Edit prices here. Each break is [quantity, total price for that quantity].
// Quantities between breaks are priced at the lower break's unit price, but never above the next break's total.
export const VAT = 0.16, DEPOSIT = 0.7, DESIGN_FEE = 1000;
export const FINISH = { standard: 1, matte: 1.1, laminated: 1.25 };
export const PRODUCTS = {
  card:    { name: 'Business cards', unit: 'cards', finishes: ['standard', 'matte', 'laminated'], breaks: [[100, 900], [250, 1900], [500, 3200], [1000, 5500]] },
  flyer:   { name: 'A5 flyers (full colour)', unit: 'flyers', finishes: ['standard', 'matte', 'laminated'], breaks: [[100, 1200], [250, 2250], [500, 3500], [1000, 5500], [2500, 11000]] },
  banner:  { name: 'Roll-up banner (85x200cm, with stand)', unit: 'banners', finishes: ['standard'], breaks: [[1, 6500], [2, 12000], [5, 28000], [10, 52000]] },
  sticker: { name: 'Vinyl stickers', unit: 'stickers', finishes: ['standard', 'matte', 'laminated'], breaks: [[100, 1500], [250, 2750], [500, 4500], [1000, 7500]] },
  tshirt:  { name: 'Branded T-shirts (1 print)', unit: 'T-shirts', finishes: ['standard'], breaks: [[10, 10500], [25, 23000], [50, 40000], [100, 72000]] },
};
export const ZONES = {
  pickup: { label: 'Collect from our office', fee: 0 },
  z1: { label: 'Zone 1: Nairobi and surroundings', fee: 350 },
  z2: { label: 'Zone 2: Thika, Nakuru, Nyeri, Machakos, Naivasha', fee: 600 },
  z3: { label: 'Zone 3: Mombasa, Kisumu, Eldoret', fee: 900 },
  z4: { label: 'Zone 4: Rest of Kenya', fee: 1300 },
};
export const HOSTING = { // shared hosting, per year. Match the features to what your reseller plan really allows.
  starter: { name: 'Starter', price: 2800, features: ['1 website', '10 GB SSD storage', '5 email accounts', 'Free SSL certificate', 'Email support'] },
  business: { name: 'Business', price: 4800, popular: true, features: ['3 websites', '30 GB SSD storage', '25 email accounts', 'Free SSL certificate', 'Weekly backups', 'WhatsApp support'] },
  businessplus: { name: 'Business Plus', price: 8500, features: ['10 websites', '60 GB SSD storage', '100 email accounts', 'Free SSL certificate', 'Daily backups', 'Free site migration'] },
  pro: { name: 'Pro', price: 14500, features: ['25 websites', '120 GB SSD storage', '250 email accounts', 'Daily backups', 'Priority support', 'Free setup and migration'] },
};
export function priceFor(p, qty) {
  const br = p.breaks;
  if (!(qty >= br[0][0])) return null;
  let low = br[0]; for (const b of br) if (qty >= b[0]) low = b;
  const tier = qty * low[1] / low[0], next = br.find(b => b[0] >= qty);
  return Math.round((next ? Math.min(tier, next[1]) : tier) / 10) * 10;
}
