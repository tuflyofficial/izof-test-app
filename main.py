import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify

app = Flask(__name__, static_folder='static', template_folder='templates')

# --- Gemini API 설정 ---
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
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if not model:
        return jsonify({"error": "서버의 API 키가 설정되지 않았습니다."}), 500

    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "데이터가 전송되지 않았습니다."}), 400

    user_input = data['text']

    # --- 토큰 최적화를 위해 압축된 프롬프트 ---
    prompt = f"""
    전문가로서 IZOF 데이터를 분석. 입력된 항목을 보고 '멘탈/체력/기술' 중 해당하는 영역을 먼저 판단할 것.
    분석은 아래 두 형식에 맞춰 순서대로, 간결하게 제시.

    ---데이터---
    {user_input}
    ---데이터 끝---

    ### 📊 핵심 요약
    * **강점**:
    * **약점**:
    * **핵심 조언**:

    ---
    ### 📝 상세 분석
    **1. 데이터 영역**: (판단한 영역과 이유)
    **2. 강점**: (구체적 분석)
    **3. 개선점**: (구체적 분석)
    **4. 실행 계획**: (실용적 훈련법 2~3가지)
    """

    try:
        response = model.generate_content(prompt)
        return jsonify({"result": response.text})
    except Exception as e:
        print(f"Gemini API 호출 중 오류 발생: {e}")
        return jsonify({"error": f"분석 중 오류가 발생했습니다: {e}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)