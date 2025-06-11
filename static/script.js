document.addEventListener('DOMContentLoaded', () => {
    // 기본 요소 선택
    const analyzeButton = document.getElementById('analyze-button');
    const dataInput = document.getElementById('data-input');
    const resultOutput = document.getElementById('result-output');
    const loader = document.getElementById('loader');

    // '훈련 스케줄 제안' 관련 요소 선택
    const scheduleSection = document.getElementById('schedule-section');
    const scheduleButton = document.getElementById('schedule-button');
    const scheduleLoader = document.getElementById('schedule-loader');
    const scheduleResultContainer = document.getElementById('schedule-result-container');
    const scheduleOutput = document.getElementById('schedule-output');

    let initialAnalysisResult = ""; // 초기 분석 결과를 저장할 변수

    // '분석하기' 버튼 클릭 이벤트
    analyzeButton.addEventListener('click', async () => {
        const inputText = dataInput.value.trim();
        if (!inputText) {
            alert('데이터를 입력해주세요.');
            return;
        }

        // 초기화
        loader.classList.remove('hidden');
        resultOutput.innerHTML = '';
        analyzeButton.disabled = true;
        scheduleSection.classList.add('hidden'); // 스케줄 섹션 숨기기
        scheduleResultContainer.style.display = 'none'; // 스케줄 결과 숨기기

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: inputText }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '서버에서 오류가 발생했습니다.');
            }

            const data = await response.json();
            initialAnalysisResult = data.result; // 결과 저장
            resultOutput.innerHTML = initialAnalysisResult.replace(/\n/g, '<br>');
            
            // 분석 성공 시 '스케줄 제안' 버튼 표시
            scheduleSection.classList.remove('hidden');

        } catch (error) {
            console.error('Error:', error);
            resultOutput.innerHTML = `<p style="color: red;">분석에 실패했습니다. 오류: ${error.message}</p>`;
        } finally {
            loader.classList.add('hidden');
            analyzeButton.disabled = false;
        }
    });

    // '훈련 스케줄 제안받기' 버튼 클릭 이벤트
    scheduleButton.addEventListener('click', async () => {
        if (!initialAnalysisResult) {
            alert('먼저 데이터 분석을 진행해주세요.');
            return;
        }

        scheduleLoader.classList.remove('hidden');
        scheduleButton.disabled = true;
        scheduleResultContainer.style.display = 'none';
        scheduleOutput.innerHTML = '';

        try {
            const response = await fetch('/generate_schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysis_text: initialAnalysisResult }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '스케줄 생성 중 오류가 발생했습니다.');
            }

            const data = await response.json();
            scheduleOutput.innerHTML = data.result.replace(/\n/g, '<br>');
            scheduleResultContainer.style.display = 'block';

        } catch (error) {
            console.error('Error:', error);
            scheduleOutput.innerHTML = `<p style="color: red;">스케줄 생성에 실패했습니다. 오류: ${error.message}</p>`;
        } finally {
            scheduleLoader.classList.add('hidden');
            scheduleButton.disabled = false;
        }
    });
});
