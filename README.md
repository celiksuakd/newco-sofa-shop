# NEWCO: demo shop for made-to-order modular sofas

**Open the shop: https://celiksuakd.github.io/newco-sofa-shop/**

This is a mock-up of NEWCO's direct-to-consumer website, made for Assignment 2 (Operations Strategy) of Operations Management 2026/27 at Politecnico di Milano (Prof. Alberto Portioli Staudacher, Group 6). NEWCO is a fictional company: nothing is sold, charged or sent. Cart, samples and demo orders stay in your browser.

## What to try

1. **Design a sofa** (`Design your sofa`). Enter your wall and room size, press *Fit the sofa to my wall*, enter your height and how you sit, then change the layout, fabric, comfort and legs. The 3D view, floor plan, price and delivery date update as you go.
2. **Mix fabrics.** In the Fabric step, click one module in the 3D view or floor plan and give it a different colour.
3. **Check out** with a 2-hour delivery slot, then follow the order on the tracking page. Move the *demo time* slider to watch it go through the workshop.
4. **Turn on `§ Ops view`** (top right). Purple tags show which section of the report each feature comes from. The ops panel has a slider for the pre-shop order pool (Table 11): push it above 3 days and the promised dates get longer.
5. **Trade desk.** Ask for a project date with your own fabric (COM): the date starts after the incoming inspection.

## How the site maps to the report

| Feature | Report | Operations choice |
|---|---|---|
| 3D configurator with room and body inputs | §1.2, §1.3 | Sofa built on the customer's specifications; complete specs captured online |
| Fit to wall, fit warnings | §1.2 | Configurator combines seat widths and armrests; order engineer checks it |
| Module list marked "In stock" | §2.2, §2.6 | Decoupling point after the 13 padded modules (MTS, Kanban); covers postponed |
| Live delivery date | §2.1, §2.5 | Capable-to-promise: day 1 validation, days 2–6 production, day 7 safety, then transit |
| Order pool slider | §2.6, Table 11 | Pool regulation: dates extended above 3 days, brought forward below 1 day |
| Fabric library, free samples | §1.2, §1.3, §2.6 | 40 families / 150 colours; lower acquisition cost; fabrics from mills in 48 h |
| Tracking timeline | §2.5 | Live order status from the shop-floor system |
| Trade desk | §1.3 | Reliable dates, shade batch control, customer's own material |
| Care and parts | §1.2 | Spare covers and modules: life-cycle cost, repeat business |

## Demo assumptions

- Module prices are set so that the average sofa (3 seats + 2 armrests) costs about €1,800 (§1.3). Fabric tiers add 0%, 12% or 25%.
- Delivery date = day 1 (same day if confirmed by 14:00 on a working day) + 5 production days + 1 safety day + transit (Italy 2 days, other markets 3). Weekends, Italian holidays and the August and Christmas closures are skipped.
- The order pool starts at 2 days of capacity × the seasonal index of the month (Table 5).

## Run it locally

No build step. Any static server works:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. The 3D view loads three.js 0.160 from jsDelivr.

Files: `index.html`, `css/style.css`, `js/data.js` (catalogue and rules), `js/model.js` (layout, price, dates), `js/sofa3d.js` (3D viewer), `js/app.js` (pages). The hero photo and process map come from our report.
