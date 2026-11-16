# PrintHub: free-hosted MVP (print quotes + M-Pesa deposits)

Frontend (`public/`) and backend (`functions/`) deploy together on Cloudflare Pages. D1 is the free database.

## Deploy (free)
1. Push this folder to a GitHub repo.
2. Cloudflare dashboard > Workers & Pages > Create > Pages > connect the repo. Build command: none. Output directory: `public`.
3. Create a D1 database (name it `printhub`), run `schema.sql` in its console, then bind it to the project: Settings > Bindings > D1 > variable name `DB`.
4. Settings > Variables and secrets: add `MPESA_KEY`, `MPESA_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, and `MPESA_ENV` (`sandbox` or `live`).
5. Redeploy. Your site is live at `yourproject.pages.dev`.

## M-Pesa
- Get free sandbox credentials at developer.safaricom.co.ke. Test with the sandbox shortcode and passkey they give you.
- Going live needs a Paybill or Till, and Safaricom's go-live approval.
- Using a Till? Change `TransactionType` in `functions/api/mpesa.js` to `CustomerBuyGoodsOnline`.

## Prices
Edit the `PRODUCTS`, `FINISH` and `DESIGN_FEE` values at the top of `functions/api/quote.js`. They are placeholders.

## Moving to your own domain later
No transfer is needed to go live: add your domain under the Pages project > Custom domains and point its DNS as instructed. Moving later to a paid host means redeploying these files there.

## Not built yet
Domain search/registration, the DIY website builder, and card/PayPal payments. Next steps are in the chat.
