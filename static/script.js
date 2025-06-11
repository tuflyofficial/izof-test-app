document.addEventListener('DOMContentLoaded', () => {
    // 모든 요소 선택
    const analyzeButton = document.getElementById('analyze-button');
    const dataInput = document.getElementById('data-input');
    const resultOutput = document.getElementById('result-output');
    const loader = document.getElementById('loader');

    const scheduleSection = document.getElementById('schedule-section');
    const scheduleButton = document.getElementById('schedule-button');
    const scheduleLoader = document.getElementById('schedule-loader');
    const scheduleResultContainer = document.getElementById('schedule-result-container');
    const scheduleOutput = document.getElementById('schedule-output');
    
    const finalReportSection = document.getElementById('final-report-section');
    const finalReportButton = document.getElementById('final-report-button');
    const finalReportLoader = document.getElementById('final-report-loader');
    const finalReportContainer = document.getElementById('final-report-container');
    const finalReportOutput = document.getElementById('final-report-output');

    let initialAnalysisResult = "";
    let scheduleResult = "";

    // 1. 분석하기
    analyzeButton.addEventListener('click', async () => {
        const inputText = dataInput.value.trim();
        if (!inputText) { alert('데이터를 입력해주세요.'); return; }
        
        loader.classList.remove('hidden');
        resultOutput.innerHTML = '';
        analyzeButton.disabled = true;
        scheduleSection.classList.add('hidden');
        finalReportSection.classList.add('hidden');

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: inputText }),
            });
            if (!response.ok) throw new Error((await response.json()).error || '서버 오류');
            const data = await response.json();
            initialAnalysisResult = data.result;
            resultOutput.innerHTML = initialAnalysisResult.replace(/\n/g, '<br>');
            scheduleSection.classList.remove('hidden');
        } catch (error) {
            resultOutput.innerHTML = `<p style="color: red;">분석 실패: ${error.message}</p>`;
        } finally {
            loader.classList.add('hidden');
            analyzeButton.disabled = false;
        }
    });

    // 2. 스케줄 제안받기
    scheduleButton.addEventListener('click', async () => {
        if (!initialAnalysisResult) { alert('먼저 데이터 분석을 진행해주세요.'); return; }

        scheduleLoader.classList.remove('hidden');
        scheduleButton.disabled = true;
        scheduleResultContainer.style.display = 'none';

        try {
            const response = await fetch('/generate_schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysis_text: initialAnalysisResult }),
            });
            if (!response.ok) throw new Error((await response.json()).error || '서버 오류');
            const data = await response.json();
            scheduleResult = data.result;
            scheduleOutput.innerHTML = scheduleResult.replace(/\n/g, '<br>');
            scheduleResultContainer.style.display = 'block';
            finalReportSection.classList.remove('hidden');
        } catch (error) {
            scheduleOutput.innerHTML = `<p style="color: red;">스케줄 생성 실패: ${error.message}</p>`;
        } finally {
            scheduleLoader.classList.add('hidden');
            scheduleButton.disabled = false;
        }
    });

    // 3. 최종 리포트 만들기
    finalReportButton.addEventListener('click', async () => {
        if (!dataInput.value || !initialAnalysisResult || !scheduleResult) {
            alert('모든 분석 단계를 먼저 완료해주세요.');
            return;
        }

        finalReportLoader.classList.remove('hidden');
        finalReportButton.disabled = true;
        finalReportContainer.style.display = 'none';

        try {
            const response = await fetch('/summarize_all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    raw_data: dataInput.value,
                    analysis_text: initialAnalysisResult,
                    schedule_text: scheduleResult
                }),
            });
            if (!response.ok) throw new Error((await response.json()).error || '서버 오류');
            const data = await response.json();
            finalReportOutput.innerHTML = data.result; // 결과가 HTML이므로 .replace 불필요
            finalReportContainer.style.display = 'block';
        } catch (error) {
            finalReportOutput.innerHTML = `<p style="color: red;">리포트 생성 실패: ${error.message}</p>`;
        } finally {
            finalReportLoader.classList.add('hidden');
            finalReportButton.disabled = false;
        }
    });
});
