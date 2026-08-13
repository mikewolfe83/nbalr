# No Bounds Auto Website

## Organized structure

- `index.html` — public landing page and 3 x 3 inventory grid
- `bill-of-sale.html` — dealer Bill of Sale tool
- `profit-calculator.html` — dealer profit calculator
- `vehicle-upload.html` — dealer vehicle inventory manager
- `css/` — all stylesheets
- `js/` — all JavaScript
- `images/` — website images
- `data/vehicles.json` — public vehicle inventory data
- `CNAME` — GitHub Pages custom domain

## Vehicle posting workflow

1. Open `vehicle-upload.html` on the live site and sign in.
2. Add the vehicle photo, price, description, and any other details.
3. Add as many vehicles as needed.
4. Click **Download vehicles.json**.
5. In GitHub, replace `data/vehicles.json` with the downloaded file and commit the change.
6. GitHub Pages will update the homepage inventory automatically.

The homepage displays up to the newest 9 vehicles:
- 3 columns on desktop
- 2 columns on tablets
- 1 column on phones

## Protected dealer tools

The Bill of Sale, Calculator, and Vehicle Upload pages use a client-side login gate.
Because GitHub Pages is a static hosting service, this is a convenience/privacy barrier, not true server-side security.
Anyone with sufficient technical knowledge can inspect or bypass client-side protection.

For true access control, move the dealer tools behind a service such as Cloudflare Access or a server-side authenticated application.
