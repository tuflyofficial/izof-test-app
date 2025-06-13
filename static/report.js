document.addEventListener('DOMContentLoaded', async () => {
    const reportContent = document.getElementById('report-content');
    const pdfButton = document.getElementById('pdf-button');
    const loader = document.getElementById('final-report-loader');

    const reportDataString = sessionStorage.getItem('reportData');
    if (!reportDataString) {
        reportContent.innerHTML = '<p style="color: red;">리포트를 생성할 데이터가 없습니다. 이전 페이지로 돌아가 분석을 다시 시작해주세요.</p>';
        return;
    }
    sessionStorage.removeItem('reportData');

    try {
        const reportData = JSON.parse(reportDataString);

        // =================================================================
        // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ JSON 데이터 형식을 처리하도록 수정한 로직 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
        
        const highNeedItems = [];
        const midNeedItems = [];
        let parsedInputData;

        // 입력 데이터가 JSON 형식인지 확인하고 파싱
        try {
            parsedInputData = JSON.parse(reportData.raw_data);
            if (!Array.isArray(parsedInputData)) throw new Error("Input is not an array.");
        } catch (e) {
            // JSON 파싱 실패 시, 기존 텍스트 방식으로 처리 (하위 호환성)
            console.error("Failed to parse input as JSON, falling back to text mode.", e);
            parsedInputData = []; // 에러 시 빈 배열로 초기화
            const lines = reportData.raw_data.trim().split('\n');
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    parsedInputData.push({
                        title: parts.slice(0, parts.length - 2).join(' '),
                        required_score: parts[parts.length - 2],
                        current_score: parts[parts.length - 1]
                    });
                }
            });
        }
        
        // 파싱된 데이터를 기반으로 점수 계산
        parsedInputData.forEach(item => {
            const ideal = parseInt(item.required_score, 10);
            const current = parseInt(item.current_score, 10);
            const itemName = item.title;

            if (!isNaN(ideal) && !isNaN(current)) {
                const score = ideal - current;
                if (score >= 3) {
                    highNeedItems.push({ name: itemName, score: score });
                } 
                else if (score === 2) {
                    midNeedItems.push({ name: itemName, score: score });
                }
            }
        });

        let aiInsightHtml = '';

        if (highNeedItems.length > 0) {
            aiInsightHtml = '<ul>';
            highNeedItems.forEach(item => {
                aiInsightHtml += `<li><strong>'${item.name}'</strong> 항목은 훈련 요구 점수가 ${item.score}점으로, 약점 보완을 위한 집중 훈련이 필요합니다.</li>`;
            });
            aiInsightHtml += '</ul>';
        } 
        else if (midNeedItems.length > 0) {
            aiInsightHtml = `<p>전반적으로 좋은 균형을 유지하고 있지만, 일부 항목에서 목표치와 약간의 차이가 있습니다. 꾸준한 관리를 통해 더 나은 상태를 만들 수 있습니다.</p>`;
        } 
        else {
            aiInsightHtml = `<p>현재 모든 항목이 목표치에 근접해 있어, 심리적/신체적으로 매우 안정적인 최적 IZOF 상태에 있습니다. 현재 상태를 유지하며 꾸준히 훈련하는 것을 추천합니다.</p>`;
        }
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ JSON 데이터 형식을 처리하도록 수정한 로직 ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        // =================================================================

        const response = await fetch('/summarize_all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                raw_data: reportData.raw_data,
                schedule_text: reportData.schedule_text,
                ai_insight_html: aiInsightHtml 
            }),
        });

        if (!response.ok) {
            throw new Error((await response.json()).error || '서버 오류');
        }

        const data = await response.json();
        reportContent.innerHTML = data.result;

    } catch (error) {
        reportContent.innerHTML = `<p style="color: red;">리포트 생성에 실패했습니다: ${error.message}</p>`;
    }

    pdfButton.addEventListener('click', () => {
        window.print();
    });
});
