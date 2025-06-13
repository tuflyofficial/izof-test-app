document.addEventListener('DOMContentLoaded', async () => {
    const reportContent = document.getElementById('report-content');
    const pdfButton = document.getElementById('pdf-button');
    const loader = document.getElementById('final-report-loader');

    // 1. 세션 스토리지에서 데이터 가져오기
    const reportDataString = sessionStorage.getItem('reportData');

    if (!reportDataString) {
        reportContent.innerHTML = '<p style="color: red;">리포트를 생성할 데이터가 없습니다. 이전 페이지로 돌아가 분석을 다시 시작해주세요.</p>';
        return;
    }

    // 사용 후 즉시 데이터 삭제
    sessionStorage.removeItem('reportData');

    try {
        const reportData = JSON.parse(reportDataString);

        // =================================================================
        // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 로직 오류를 수정한 AI Insight 생성 코드 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
        
        const highNeedItems = [];
        const lines = reportData.raw_data.trim().split('\n');
        
        // 훈련 요구 점수가 2인 항목들을 저장할 배열
        const midNeedItems = [];

        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
                const itemName = parts.slice(0, parts.length - 2).join(' ');
                const ideal = parseInt(parts[parts.length - 2], 10);
                const current = parseInt(parts[parts.length - 1], 10);

                if (!isNaN(ideal) && !isNaN(current)) {
                    const score = ideal - current;
                    // 점수가 3점 이상인 항목을 highNeedItems에 추가
                    if (score >= 3) {
                        highNeedItems.push({ name: itemName, score: score });
                    } 
                    // 점수가 2점인 항목을 midNeedItems에 추가
                    else if (score === 2) {
                        midNeedItems.push({ name: itemName, score: score });
                    }
                }
            }
        });

        let aiInsightHtml = '';

        // 1순위: 점수가 3점 이상인 항목이 하나라도 있는 경우
        if (highNeedItems.length > 0) {
            aiInsightHtml = '<ul>';
            highNeedItems.forEach(item => {
                aiInsightHtml += `<li><strong>'${item.name}'</strong> 항목은 훈련 요구 점수가 ${item.score}점으로, 약점 보완을 위한 집중 훈련이 필요합니다.</li>`;
            });
            aiInsightHtml += '</ul>';
        } 
        // 2순위: 3점 이상은 없지만, 2점인 항목이 있는 경우
        else if (midNeedItems.length > 0) {
            aiInsightHtml = `<p>전반적으로 좋은 균형을 유지하고 있지만, 일부 항목에서 목표치와 약간의 차이가 있습니다. 꾸준한 관리를 통해 더 나은 상태를 만들 수 있습니다.</p>`;
        } 
        // 3순위: 모든 점수가 1점 이하인 최적의 경우
        else {
            aiInsightHtml = `<p>현재 모든 항목이 목표치에 근접해 있어, 심리적/신체적으로 매우 안정적인 최적 IZOF 상태에 있습니다. 현재 상태를 유지하며 꾸준히 훈련하는 것을 추천합니다.</p>`;
        }
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ 로직 오류를 수정한 AI Insight 생성 코드 ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        // =================================================================


        // 2. 서버에 최종 리포트(HTML) 요청
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

    // 4. PDF 저장 버튼에 프린트 기능 추가
    pdfButton.addEventListener('click', () => {
        window.print();
    });
});
