import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify

app = Flask(__name__, static_folder='static', template_folder='templates')

# --- Gemini API 설정 ---
# Replit의 Secrets (환경 변수)에 GEMINI_API_KEY를 저장해야 합니다.
try:
    api_key = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"Gemini API 키 설정에 실패했습니다: {e}")
    model = None

# --- 라우트 설정 ---

@app.route('/')
def index():
    """메인 페이지를 렌더링합니다."""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    """IZOF 데이터 분석 요청을 처리합니다."""
    if not model:
        return jsonify({"error": "서버의 API 키가 설정되지 않았습니다."}), 500

    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "데이터가 전송되지 않았습니다."}), 400

    user_input = data['text']

    # Gemini API에 보낼 프롬프트 구성
    prompt = f"""
    당신은 스포츠 심리학 전문가입니다. IZOF(Individualized Zones of Optimal Functioning) 모델을 기반으로 선수의 심리 상태를 분석하고 구체적인 조언을 제공해야 합니다.

    아래는 한 선수의 IZOF 데이터입니다. 각 항목은 '[항목명] [이상적 상태 점수] [현재 상태 점수]' 형식으로 되어 있습니다.

    --- 데이터 시작 ---
    {user_input}
    --- 데이터 끝 ---

    위 데이터를 바탕으로 다음 형식에 맞춰 상세하게 분석해주세요.

    ### 📝 총평
    현재 선수의 심리 상태에 대한 전반적인 요약과 가장 두드러지는 특징을 설명해주세요.

    ### 👍 강점 (Strong Points)
    이상적 상태에 가깝거나 현재 상태 점수가 높은 항목을 기반으로 선수의 현재 강점을 2~3가지 분석해주세요.

    ### 😟 개선점 (Areas for Improvement)
    이상적 상태와 현재 상태의 점수 차이가 큰 항목을 중심으로 개선이 필요한 부분을 2~3가지 분석해주세요.

    ### 💡 실행 계획 (Action Plan)
    분석된 개선점을 보완하기 위한 구체적이고 실용적인 심리 훈련 방법이나 행동 전략을 2~3가지 제안해주세요. 전문가처럼 현실적인 조언을 해주세요.
    """

    try:
        response = model.generate_content(prompt)
        # Gemini API 응답을 클라이언트에 JSON 형식으로 반환
        return jsonify({"result": response.text})
    except Exception as e:
        print(f"Gemini API 호출 중 오류 발생: {e}")
        return jsonify({"error": f"분석 중 오류가 발생했습니다: {e}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=81)