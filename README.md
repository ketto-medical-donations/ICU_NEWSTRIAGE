# NEWS ICU Triage Calculator & Tracker

A professional, high-fidelity, client-side clinical calculator for computing the National Early Warning Score (NEWS) and managing triage tracking records.

## Features

- **Real-time Scoring & Triage**: Physiological parameter inputs update the score, risk categories, and clinical escalation recommendations instantaneously.
- **Glassmorphism Theme**: Premium, modern, responsive interface using deep navy dark aesthetics, responsive layouts, and HSL color-coded alert indicators.
- **Interactive Controls**: Syncs custom styled sliders with number inputs for easy, precise entry of values in clinical settings.
- **Dual-Unit Temperature Support**: Seamlessly toggles between Celsius (°C) and Fahrenheit (°F) with automated conversion and range scoring boundaries.
- **Clinical "RED Score" Safety Mechanism**: Proactively identifies extreme variations in individual parameters (value of 3 points) and upgrades patient classification to Medium Risk, adhering strictly to international medical protocols.
- **Patient Triage History Logs**: Keeps records of assessments (stored in LocalStorage) including physiological summaries, timestamps, and patient ID codes. Supports individual record deletion and clearing of history logs.
- **Disclaimers & Safety Guidance**: Integrated safety warning banners to ensure clinical users refer to institutional outreach protocols.

## Technical Details

- **Core Tech Stack**: HTML5, Vanilla CSS3 (Custom Properties, Flexbox, CSS Grid), Vanilla ES6 JavaScript.
- **Font Stack**: Outfit (via Google Fonts).
- **Icons**: FontAwesome Web Icons (via CDN).
- **SEO Ready**: Standard semantic heading layouts, title descriptions, unique DOM element test identifiers, and optimized assets.

## NEWS Scoring Reference Table

| Physiological Parameter | 3 Points | 2 Points | 1 Point | 0 Points | 1 Point | 2 Points | 3 Points |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Respiratory Rate (breaths/min)** | ≤8 | | 9–11 | 12–20 | | 21–24 | ≥25 |
| **Oxygen Saturation (%)** | ≤91 | 92–93 | 94–95 | ≥96 | | | |
| **Supplemental Oxygen** | | | | Room Air (No) | Oxygen (Yes) | | |
| **Temperature (°C)** | ≤35.0 | | 35.1–36.0 | 36.1–38.0 | 38.1–39.0 | | ≥39.1 |
| **Systolic Blood Pressure (mmHg)** | ≤90 | 91–100 | 101–110 | 111–219 | | | ≥220 |
| **Heart Rate (bpm)** | ≤40 | | 41–50 | 51–90 | 91–110 | 111–130 | ≥131 |
| **AVPU Status** | | | | Alert (A) | | | Voice/Pain/Unresponsive (V/P/U) |

### Interpretation Categories
- **NEWS = 0**: Normal (No risk) - Routine ongoing clinical monitoring.
- **NEWS = 1–4**: Low risk - Prompt assessment by a competent registered nurse.
- **NEWS = 5–6** OR any single parameter score = 3 (**RED score**): Medium risk - Urgent review by an acute team nurse or ward doctor, consider critical care outreach team escalation.
- **NEWS ≥ 7**: High risk - Emergency assessment by critical-care team, transfer to higher dependency/ICU area.

## Setup & Deployment
Open the `index.html` file in any modern web browser to run the application locally. No build step or package installation required.
