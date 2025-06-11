document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyze-button');
    const dataInput = document.getElementById('data-input');
    const resultOutput = document.getElementById('result-output');
    const loader = document.getElementById('loader');

    analyzeButton.addEventListener('click', async () => {
        const inputText = dataInput.value.trim();
        if (!inputText) {
            alert('데이터를 입력해주세요.');
            return;
        }

        // 로딩 시작
        loader.classList.remove('hidden');
        resultOutput.innerHTML = '';
        analyzeButton.disabled = true;

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: inputText }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '서버에서 오류가 발생했습니다.');
            }

            const data = await response.json();
            
            // 결과를 HTML로 렌더링 (Markdown 형식의 줄바꿈을 <br>로 변환)
            resultOutput.innerHTML = data.result.replace(/\n/g, '<br>');

        } catch (error) {
            console.error('Error:', error);
            resultOutput.innerHTML = `<p style="color: red;">분석에 실패했습니다. 오류: ${error.message}</p>`;
        } finally {
            // 로딩 종료
            loader.classList.add('hidden');
            analyzeButton.disabled = false;
        }
    });
});