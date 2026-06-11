// app.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Inputs
    const form = document.getElementById('triage-form');
    const inputRr = document.getElementById('input-rr');
    const sliderRr = document.getElementById('slider-rr');
    const inputSpo2 = document.getElementById('input-spo2');
    const sliderSpo2 = document.getElementById('slider-spo2');
    const inputTemp = document.getElementById('input-temp');
    const sliderTemp = document.getElementById('slider-temp');
    const inputSbp = document.getElementById('input-sbp');
    const sliderSbp = document.getElementById('slider-sbp');
    const inputHr = document.getElementById('input-hr');
    const sliderHr = document.getElementById('slider-hr');
    
    const tempMinLbl = document.getElementById('temp-min-lbl');
    const tempMaxLbl = document.getElementById('temp-max-lbl');
    
    const resetBtn = document.getElementById('btn-reset-form');
    
    // DOM Elements - Outputs
    const totalScoreDisplay = document.getElementById('total-score');
    const riskBadge = document.getElementById('risk-badge');
    const redScoreAlert = document.getElementById('red-score-alert');
    const recommendationText = document.getElementById('recommendation-text');
    const scoreCard = document.getElementById('score-card');
    const gaugeFill = document.getElementById('gauge-fill');
    
    // DOM Elements - Logs
    const patientIdInput = document.getElementById('log-patient-id');
    const saveLogBtn = document.getElementById('btn-save-log');
    const logTableBody = document.getElementById('log-table-body');
    const clearLogsBtn = document.getElementById('btn-clear-logs');
    const logActionsBar = document.getElementById('log-actions-bar');

    // Global state
    let tempUnit = 'C'; // 'C' or 'F'
    const GAUGE_CIRCUMFERENCE = 263.89; // 2 * Math.PI * 42

    // Default Clinical Values
    const defaults = {
        rr: 16,
        spo2: 98,
        suppO2: 'no',
        tempC: 36.8,
        tempF: 98.2,
        sbp: 120,
        hr: 72,
        avpu: 'A'
    };

    // ----------------------------------------------------
    // Input Synchronization (Sliders & Numeric Inputs)
    // ----------------------------------------------------
    function syncInputs(numericInput, sliderInput, isFloat = false) {
        // Numeric updates Slider
        numericInput.addEventListener('input', () => {
            let val = isFloat ? parseFloat(numericInput.value) : parseInt(numericInput.value, 10);
            const min = parseFloat(numericInput.min);
            const max = parseFloat(numericInput.max);
            
            if (isNaN(val)) return;
            if (val < min) val = min;
            if (val > max) val = max;
            
            sliderInput.value = val;
            calculateScore();
        });

        // Numeric blur ensures value constraints
        numericInput.addEventListener('blur', () => {
            let val = isFloat ? parseFloat(numericInput.value) : parseInt(numericInput.value, 10);
            const min = parseFloat(numericInput.min);
            const max = parseFloat(numericInput.max);
            
            if (isNaN(val) || val < min) {
                numericInput.value = min;
            } else if (val > max) {
                numericInput.value = max;
            }
            sliderInput.value = numericInput.value;
            calculateScore();
        });

        // Slider updates Numeric
        sliderInput.addEventListener('input', () => {
            numericInput.value = sliderInput.value;
            calculateScore();
        });
    }

    syncInputs(inputRr, sliderRr);
    syncInputs(inputSpo2, sliderSpo2);
    syncInputs(inputTemp, sliderTemp, true);
    syncInputs(inputSbp, sliderSbp);
    syncInputs(inputHr, sliderHr);

    // Radios change recalculate
    form.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.name === 'temp-unit') {
                handleTempUnitChange(e.target.value);
            } else {
                calculateScore();
            }
        });
    });

    // ----------------------------------------------------
    // Temperature Unit Conversion & Boundaries
    // ----------------------------------------------------
    function handleTempUnitChange(newUnit) {
        if (tempUnit === newUnit) return;
        
        const currentVal = parseFloat(inputTemp.value);
        if (isNaN(currentVal)) return;

        if (newUnit === 'F') {
            // Convert C to F: (C * 9/5) + 32
            const converted = (currentVal * 9/5) + 32;
            setupTempRange(30 * 9/5 + 32, 45 * 9/5 + 32, converted.toFixed(1));
            tempUnit = 'F';
        } else {
            // Convert F to C: (F - 32) * 5/9
            const converted = (currentVal - 32) * 5/9;
            setupTempRange(30, 45, converted.toFixed(1));
            tempUnit = 'C';
        }
        calculateScore();
    }

    function setupTempRange(min, max, value) {
        inputTemp.min = min;
        inputTemp.max = max;
        inputTemp.value = value;
        
        sliderTemp.min = min;
        sliderTemp.max = max;
        sliderTemp.value = value;

        tempMinLbl.textContent = Math.round(min);
        tempMaxLbl.textContent = Math.round(max);
    }

    // Reset Form Fields to standard normals
    resetBtn.addEventListener('click', () => {
        inputRr.value = defaults.rr;
        sliderRr.value = defaults.rr;
        
        inputSpo2.value = defaults.spo2;
        sliderSpo2.value = defaults.spo2;
        
        document.getElementById('supp-no').checked = true;
        
        // Reset temp based on current unit selection
        if (tempUnit === 'C') {
            setupTempRange(30, 45, defaults.tempC);
        } else {
            setupTempRange(30 * 9/5 + 32, 45 * 9/5 + 32, defaults.tempF);
        }
        
        inputSbp.value = defaults.sbp;
        sliderSbp.value = defaults.sbp;
        
        inputHr.value = defaults.hr;
        sliderHr.value = defaults.hr;
        
        document.getElementById('avpu-a').checked = true;
        
        calculateScore();
    });

    // ----------------------------------------------------
    // NEWS Scoring Calculation Core
    // ----------------------------------------------------
    function getRespiratoryRateScore(rr) {
        if (rr <= 8) return 3;
        if (rr >= 9 && rr <= 11) return 1;
        if (rr >= 12 && rr <= 20) return 0;
        if (rr >= 21 && rr <= 24) return 2;
        if (rr >= 25) return 3;
        return 0;
    }

    function getOxygenSaturationScore(spo2) {
        if (spo2 <= 91) return 3;
        if (spo2 >= 92 && spo2 <= 93) return 2;
        if (spo2 >= 94 && spo2 <= 95) return 1;
        if (spo2 >= 96) return 0;
        return 0;
    }

    function getSupplementalOxygenScore(val) {
        return val === 'yes' ? 1 : 0;
    }

    function getTemperatureScore(tempVal, unit) {
        if (unit === 'F') {
            if (tempVal <= 95.0) return 3;
            if (tempVal <= 96.8) return 1;
            if (tempVal <= 100.4) return 0;
            if (tempVal <= 102.2) return 1;
            return 2; // >= 102.3
        } else {
            if (tempVal <= 35.0) return 3;
            if (tempVal <= 36.0) return 1;
            if (tempVal <= 38.0) return 0;
            if (tempVal <= 39.0) return 1;
            return 2; // >= 39.1
        }
    }

    function getSystolicBPScore(sbp) {
        if (sbp <= 90) return 3;
        if (sbp >= 91 && sbp <= 100) return 2;
        if (sbp >= 101 && sbp <= 110) return 1;
        if (sbp >= 111 && sbp <= 219) return 0;
        if (sbp >= 220) return 3;
        return 0;
    }

    function getHeartRateScore(hr) {
        if (hr <= 40) return 3;
        if (hr >= 41 && hr <= 50) return 1;
        if (hr >= 51 && hr <= 90) return 0;
        if (hr >= 91 && hr <= 110) return 1;
        if (hr >= 111 && hr <= 130) return 2;
        if (hr >= 131) return 3;
        return 0;
    }

    function getAVPUScore(avpu) {
        return avpu === 'A' ? 0 : 3;
    }

    // ----------------------------------------------------
    // Update DOM & Visual Gauge
    // ----------------------------------------------------
    function updateIndicatorBar(elementId, text, score) {
        const bar = document.getElementById(elementId);
        if (!bar) return;
        
        const textSpan = bar.querySelector('span:not(.sub-score-badge)');
        const badge = bar.querySelector('.sub-score-badge');
        
        textSpan.textContent = text;
        badge.className = `sub-score-badge val-${score}`;
        badge.textContent = `${score} pt${score !== 1 ? 's' : ''}`;
    }

    function calculateScore() {
        const rr = parseInt(inputRr.value, 10);
        const spo2 = parseInt(inputSpo2.value, 10);
        const suppO2 = document.querySelector('input[name="supp-o2"]:checked').value;
        const temp = parseFloat(inputTemp.value);
        const sbp = parseInt(inputSbp.value, 10);
        const hr = parseInt(inputHr.value, 10);
        const avpu = document.querySelector('input[name="avpu"]:checked').value;

        // Perform validation
        if (isNaN(rr) || isNaN(spo2) || isNaN(temp) || isNaN(sbp) || isNaN(hr)) {
            return;
        }

        // Subscores
        const rrScore = getRespiratoryRateScore(rr);
        const spo2Score = getOxygenSaturationScore(spo2);
        const suppScore = getSupplementalOxygenScore(suppO2);
        const tempScore = getTemperatureScore(temp, tempUnit);
        const sbpScore = getSystolicBPScore(sbp);
        const hrScore = getHeartRateScore(hr);
        const avpuScore = getAVPUScore(avpu);

        // Subscore Details for Logging & Display Info
        const scores = {
            rr: { val: rr, score: rrScore, label: `${rr} bpm` },
            spo2: { val: spo2, score: spo2Score, label: `${spo2}%` },
            supp: { val: suppO2 === 'yes' ? 'Yes' : 'No', score: suppScore, label: suppO2 === 'yes' ? 'O₂' : 'Air' },
            temp: { val: temp, score: tempScore, label: `${temp}°${tempUnit}` },
            sbp: { val: sbp, score: sbpScore, label: `${sbp} mmHg` },
            hr: { val: hr, score: hrScore, label: `${hr} bpm` },
            avpu: { val: avpu, score: avpuScore, label: avpu }
        };

        // Update helper indicator labels inside form
        updateIndicatorBar('indicator-rr', getRRLabelText(rr, rrScore), rrScore);
        updateIndicatorBar('indicator-spo2', getSpO2LabelText(spo2, spo2Score), spo2Score);
        updateIndicatorBar('indicator-supp-o2', suppO2 === 'yes' ? 'Supplemental Oxygen Active' : 'Breathing Room Air', suppScore);
        updateIndicatorBar('indicator-temp', getTempLabelText(temp, tempUnit, tempScore), tempScore);
        updateIndicatorBar('indicator-sbp', getSBPLabelText(sbp, sbpScore), sbpScore);
        updateIndicatorBar('indicator-hr', getHRLabelText(hr, hrScore), hrScore);
        updateIndicatorBar('indicator-avpu', avpu === 'A' ? 'Alert and responsive' : `Responds only to ${avpu === 'V' ? 'Voice' : avpu === 'P' ? 'Pain' : 'Unresponsive'}`, avpuScore);

        // Total
        const total = rrScore + spo2Score + suppScore + tempScore + sbpScore + hrScore + avpuScore;

        // Check for RED Score: Any single parameter scoring 3
        const hasRedScore = (rrScore === 3 || spo2Score === 3 || tempScore === 3 || sbpScore === 3 || hrScore === 3 || avpuScore === 3);

        // Classification & Escalation
        let categoryClass = 'triage-normal';
        let categoryName = 'Normal';
        let recommendation = '';

        if (total >= 7) {
            categoryClass = 'triage-high';
            categoryName = 'High Risk';
            recommendation = '<strong>NEWS ≥ 7: High Risk.</strong> Immediate emergency assessment by a clinical team / critical care outreach team with critical-care competencies. Transfer of the patient to a higher dependency care area (e.g. ICU or HDU) should be planned immediately.';
        } else if (total >= 5 || hasRedScore) {
            categoryClass = 'triage-medium';
            categoryName = 'Medium Risk';
            recommendation = '<strong>NEWS 5–6 or RED Score: Medium Risk.</strong> Urgent review by a clinician skilled in assessing acute illness (typically a ward doctor or acute team nurse). The clinician should decide whether escalation of care to a critical care outreach team is required.';
        } else if (total >= 1 && total <= 4) {
            categoryClass = 'triage-low';
            categoryName = 'Low Risk';
            recommendation = '<strong>NEWS 1–4: Low Risk.</strong> Prompt assessment by a competent registered nurse. The nurse should decide if a change to the frequency of clinical monitoring or an escalation of clinical care is required.';
        } else {
            categoryClass = 'triage-normal';
            categoryName = 'Normal (No Risk)';
            recommendation = '<strong>NEWS 0: Normal.</strong> Patient is stable. Continue routine ongoing clinical monitoring and observation according to standard ward protocols.';
        }

        // Apply visual updates
        totalScoreDisplay.textContent = total;
        riskBadge.textContent = categoryName;
        recommendationText.innerHTML = recommendation;

        // Score Card Triage Color Class
        scoreCard.className = `score-card ${categoryClass}`;

        // Red Score Warning
        if (hasRedScore) {
            redScoreAlert.classList.remove('hide');
        } else {
            redScoreAlert.classList.add('hide');
        }

        // Circular Gauge Update
        // NEWS ranges from 0 to 19 max. We cap dashoffset calculation at max 19.
        const maxNEWSVal = 19;
        const progressPercentage = Math.min(total / maxNEWSVal, 1.0);
        const strokeOffset = GAUGE_CIRCUMFERENCE - (progressPercentage * GAUGE_CIRCUMFERENCE);
        gaugeFill.style.strokeDashoffset = strokeOffset;

        // Store calculations in state for logging
        window.currentTriageState = {
            total: total,
            category: categoryName,
            categoryClass: categoryClass,
            hasRedScore: hasRedScore,
            scores: scores
        };

        // Render sorted breakdown table and alerts
        renderParameterBreakdown(scores);
    }

    function renderParameterBreakdown(scores) {
        const tbody = document.getElementById('breakdown-table-body');
        const alertContainer = document.getElementById('urgent-doctor-alert-container');
        if (!tbody) return;

        // Convert scores to list for sorting
        const items = [
            { name: 'Respiratory Rate', val: scores.rr.label, score: scores.rr.score },
            { name: 'Oxygen Saturation', val: scores.spo2.label, score: scores.spo2.score },
            { name: 'Supplemental Oxygen', val: scores.supp.label, score: scores.supp.score },
            { name: 'Temperature', val: scores.temp.label, score: scores.temp.score },
            { name: 'Systolic Blood Pressure', val: scores.sbp.label, score: scores.sbp.score },
            { name: 'Heart Rate', val: scores.hr.label, score: scores.hr.score },
            { name: 'AVPU Consciousness State', val: scores.avpu.label, score: scores.avpu.score }
        ];

        // Sort items in ascending order of score
        items.sort((a, b) => a.score - b.score);

        // Render rows
        tbody.innerHTML = '';
        let hasScoreOf3 = false;

        items.forEach(item => {
            if (item.score === 3) {
                hasScoreOf3 = true;
            }

            const tr = document.createElement('tr');
            let badgeClass = 'val-0';
            if (item.score === 1) badgeClass = 'val-1';
            else if (item.score === 2) badgeClass = 'val-2';
            else if (item.score === 3) badgeClass = 'val-3';

            tr.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td><span class="summary-pill">${item.val}</span></td>
                <td style="text-align: right;">
                    <span class="sub-score-badge ${badgeClass}">${item.score} pt${item.score !== 1 ? 's' : ''}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Trigger doctor alert if any single parameter is 3
        if (hasScoreOf3) {
            alertContainer.innerHTML = `
                <div class="urgent-doctor-alert">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <div>
                        <strong>URGENT CLINICIAN ALERT:</strong> Critical individual parameter score of 3 detected! Please contact the doctor immediately.
                    </div>
                </div>
            `;
        } else {
            alertContainer.innerHTML = '';
        }
    }

    // Helper text builders for physiological sub-ranges
    function getRRLabelText(val, score) {
        if (score === 3) return val <= 8 ? 'Critically low (≤8)' : 'Critically high (≥25)';
        if (score === 2) return 'Elevated (21-24)';
        if (score === 1) return 'Borderline low (9-11)';
        return 'Normal (12-20)';
    }

    function getSpO2LabelText(val, score) {
        if (score === 3) return 'Critically low (≤91%)';
        if (score === 2) return 'Very low (92-93%)';
        if (score === 1) return 'Borderline low (94-95%)';
        return 'Normal (≥96%)';
    }

    function getTempLabelText(val, unit, score) {
        const symbol = `°${unit}`;
        if (score === 3) return `Critically hypothermic (≤${unit === 'C' ? '35.0' : '95.0'}${symbol})`;
        if (score === 2) return `Critically hyperthermic (≥${unit === 'C' ? '39.1' : '102.3'}${symbol})`;
        if (score === 1) return val < (unit === 'C' ? 36.1 : 96.9) ? `Subnormal (${unit === 'C' ? '35.1-36.0' : '95.1-96.8'}${symbol})` : `Feverish (${unit === 'C' ? '38.1-39.0' : '100.5-102.2'}${symbol})`;
        return `Normal (${unit === 'C' ? '36.1-38.0' : '96.9-100.4'}${symbol})`;
    }

    function getSBPLabelText(val, score) {
        if (score === 3) return val <= 90 ? 'Critically low (≤90)' : 'Critically high (≥220)';
        if (score === 2) return 'Very low (91-100)';
        if (score === 1) return 'Borderline low (101-110)';
        return 'Normal (111-219)';
    }

    function getHRLabelText(val, score) {
        if (score === 3) return val <= 40 ? 'Critically bradycardic (≤40)' : 'Critically tachycardic (≥131)';
        if (score === 2) return 'Severe tachycardia (111-130)';
        if (score === 1) return val < 51 ? 'Borderline bradycardia (41-50)' : 'Borderline tachycardia (91-110)';
        return 'Normal (51-90)';
    }

    // ----------------------------------------------------
    // Patient Triage Logs (LocalStorage)
    // ----------------------------------------------------
    function getLogs() {
        const stored = localStorage.getItem('news_triage_logs');
        return stored ? JSON.parse(stored) : [];
    }

    function saveLogs(logs) {
        localStorage.setItem('news_triage_logs', JSON.stringify(logs));
        renderLogs();
    }

    function renderLogs() {
        const logs = getLogs();
        logTableBody.innerHTML = '';

        if (logs.length === 0) {
            logTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6"><i class="fa-solid fa-inbox"></i> No triage logs recorded yet.</td>
                </tr>
            `;
            logActionsBar.classList.add('hide');
            return;
        }

        logActionsBar.classList.remove('hide');

        logs.forEach(log => {
            const tr = document.createElement('tr');
            
            // Format Timestamp
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const date = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
            
            // Format Risk Pill category style
            let badgeClass = 'cat-normal';
            if (log.category.includes('High')) badgeClass = 'cat-high';
            else if (log.category.includes('Medium')) badgeClass = 'cat-medium';
            else if (log.category.includes('Low')) badgeClass = 'cat-low';

            // Generate summaries
            const summaryPills = [];
            Object.keys(log.scores).forEach(key => {
                const item = log.scores[key];
                let contribClass = '';
                if (item.score === 3) contribClass = 'contrib-3';
                else if (item.score > 0) contribClass = 'contrib-any';
                
                let title = '';
                if (key === 'rr') title = 'RR';
                else if (key === 'spo2') title = 'SpO₂';
                else if (key === 'supp') title = 'O₂';
                else if (key === 'temp') title = 'T';
                else if (key === 'sbp') title = 'BP';
                else if (key === 'hr') title = 'HR';
                else if (key === 'avpu') title = 'AVPU';

                summaryPills.push(`<span class="summary-pill ${contribClass}" title="Score: ${item.score}">${title}: ${item.label}</span>`);
            });

            tr.innerHTML = `
                <td>
                    <div style="font-weight:600;">${time}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${date}</div>
                </td>
                <td><strong style="color:var(--text-primary); font-size:0.9rem;">${escapeHtml(log.patientId)}</strong></td>
                <td>
                    <span class="score-indicator-badge ${badgeClass}" style="font-size: 1.05rem; padding: 0.2rem 0.6rem;">
                        ${log.total}
                    </span>
                </td>
                <td><span class="score-indicator-badge ${badgeClass}">${log.category}</span></td>
                <td>
                    <div class="summary-pill-container">
                        ${summaryPills.join('')}
                    </div>
                </td>
                <td style="text-align:right;">
                    <button class="btn-delete-row" data-id="${log.id}" title="Delete assessment log">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;

            logTableBody.appendChild(tr);
        });

        // Rebind delete events
        document.querySelectorAll('.btn-delete-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const logId = e.currentTarget.getAttribute('data-id');
                deleteLog(logId);
            });
        });
    }

    function addLog() {
        const patientId = patientIdInput.value.trim() || 'Anonymous';
        const currentState = window.currentTriageState;
        
        if (!currentState) return;

        const newLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            patientId: patientId,
            total: currentState.total,
            category: currentState.category,
            scores: currentState.scores
        };

        const logs = getLogs();
        logs.unshift(newLog); // Prepend to show latest first
        saveLogs(logs);

        // Reset input fields
        patientIdInput.value = '';
        
        // Brief scroll or blink highlight
        const firstRow = logTableBody.querySelector('tr');
        if (firstRow) {
            firstRow.style.animation = 'none';
            firstRow.offsetHeight; /* trigger reflow */
            firstRow.style.animation = 'pulseDot 1s ease-in-out';
        }
    }

    function deleteLog(id) {
        let logs = getLogs();
        logs = logs.filter(log => log.id !== id);
        saveLogs(logs);
    }

    function clearAllLogs() {
        if (confirm('Are you sure you want to permanently delete all triage logs?')) {
            saveLogs([]);
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    // Bind log action events
    saveLogBtn.addEventListener('click', addLog);
    clearLogsBtn.addEventListener('click', clearAllLogs);
    
    // Bind Enter key on patient input to save log
    patientIdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addLog();
        }
    });

    // Run initial score evaluation
    calculateScore();
    // Render initial logs
    renderLogs();
});
