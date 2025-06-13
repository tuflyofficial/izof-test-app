document.addEventListener('DOMContentLoaded', () => {
    // 요소 선택
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

    let initialAnalysisResult = "";
    let scheduleResult = "";

    // 1. 분석하기
    analyzeButton.addEventListener('click', async () => {
        const inputText = dataInput.value.trim();
        if (!inputText) { alert('데이터를 입력해주세요.'); return; }
        
        loader.classList.remove('hidden');
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
        
        try {
            const response = await fetch('/generate_schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // ▼▼▼▼▼▼▼▼▼ 원본 데이터(raw_data)를 함께 전송하도록 수정 ▼▼▼▼▼▼▼▼▼
                body: JSON.stringify({ 
                    analysis_text: initialAnalysisResult,
                    raw_data: dataInput.value 
                }),
                // ▲▲▲▲▲▲▲▲▲ 원본 데이터(raw_data)를 함께 전송하도록 수정 ▲▲▲▲▲▲▲▲▲
            });
            if (!response.ok) throw new Error((await response.json()).error || '서버 오류');
            const data = await response.json();
            scheduleResult = data.result;
            // 링크가 클릭 가능하도록 .innerHTML 사용 (XSS 방지에 유의해야 하나, 이 경우는 서버에서 생성한 안전한 링크이므로 사용)
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

    // 3. 최종 리포트 새 탭으로 열기
    finalReportButton.addEventListener('click', () => {
        if (!dataInput.value || !scheduleResult) {
            alert('모든 분석 단계를 먼저 완료해주세요.');
            return;
        }

        const reportData = {
            raw_data: dataInput.value,
            schedule_text: scheduleResult
        };

        sessionStorage.setItem('reportData', JSON.stringify(reportData));
        window.open('/report', '_blank');
    });
});
