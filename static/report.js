document.addEventListener('DOMContentLoaded', async () => {
    const reportContent = document.getElementById('report-content');
    const pdfButton = document.getElementById('pdf-button');
    const loader = document.getElementById('final-report-loader');

    // 1. 세션 스토리지에서 리포트 생성에 필요한 데이터 가져오기
    const reportDataString = sessionStorage.getItem('reportData');

    if (!reportDataString) {
        reportContent.innerHTML = '<p style="color: red;">리포트를 생성할 데이터가 없습니다. 이전 페이지로 돌아가 분석을 다시 시작해주세요.</p>';
        return;
    }

    // 사용 후 즉시 데이터 삭제
    sessionStorage.removeItem('reportData');

    try {
        const reportData = JSON.parse(reportDataString);

        // 2. 서버에 최종 리포트(HTML) 요청
        const response = await fetch('/summarize_all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData),
        });

        if (!response.ok) {
            throw new Error((await response.json()).error || '서버 오류');
        }

        const data = await response.json();

        // 3. 받은 HTML을 페이지에 렌더링
        reportContent.innerHTML = data.result;

    } catch (error) {
        reportContent.innerHTML = `<p style="color: red;">리포트 생성에 실패했습니다: ${error.message}</p>`;
    }

    // 4. PDF 저장 버튼에 프린트 기능 추가
    pdfButton.addEventListener('click', () => {
        window.print();
    });
});