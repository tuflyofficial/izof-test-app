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

@app.after_request
def after_request(response):
    response.headers.pop('X-Frame-Options', None)
    return response

@app.route('/analyze', methods=['POST'])
def analyze():
    if not model:
        return jsonify({"error": "서버의 API 키가 설정되지 않았습니다."}), 500

    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "데이터가 전송되지 않았습니다."}), 400

    user_input = data['text']
    
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

@app.route('/generate_schedule', methods=['POST'])
def generate_schedule():
    if not model:
        return jsonify({"error": "서버의 API 키가 설정되지 않았습니다."}), 500

    data = request.json
    if not data or 'analysis_text' not in data:
        return jsonify({"error": "분석 결과 데이터가 없습니다."}), 400

    analysis_text = data['analysis_text']

    prompt = f"""
    당신은 선수의 약점을 보완하기 위한 실행 계획을 제시하는 전문 코치입니다.
    아래에 주어진 1차 분석 결과를 바탕으로, 선수를 위한 구체적인 다음 단계를 제안해주세요.

    --- 1차 분석 결과 ---
    {analysis_text}
    --- 1차 분석 결과 끝 ---

    **지시사항:**
    1.  먼저 1차 분석 결과에서 '데이터 영역'이 **'멘탈'**인지, 아니면 **'체력' 또는 '기술'**인지 판단하세요.
    2.  판단에 따라 아래 두 가지 방식 중 하나로만 답변해야 합니다.

    ---
    **A) 만약 '멘탈' 문제일 경우:**

    ### 🧘 마음 챙김 및 멘탈 강화 프로그램

    멘탈적인 어려움은 혼자 해결하기보다 전문가와 함께하는 것이 효과적입니다. 아래는 스스로 시도해볼 수 있는 몇 가지 방법과 전문가를 찾을 수 있는 곳입니다.

    **1. 추천 멘탈 훈련 (2-3가지 제안):**
    * (예: 명상, 심호흡, 긍정 확언 등 선수의 약점과 관련된 구체적인 멘탈 훈련 방법을 제안)

    **2. 전문가의 도움이 필요할 때:**
    * 혼자서 해결하기 어려운 감정이나 생각이 든다면, 주저하지 말고 전문가의 도움을 받는 것이 중요합니다.
    * 전문적인 상담과 코칭은 '터플라이'와 같은 플랫폼에서 찾을 수 있습니다.
    * **웹사이트: https://app.tufly.co.kr/**

    ---
    **B) 만약 '체력' 또는 '기술' 문제일 경우:**

    ### 🏋️ 1-2주 집중 훈련 스케줄

    아래는 분석된 약점을 보완하기 위한 1-2주간의 샘플 훈련 스케줄입니다. 선수의 현재 컨디션에 맞춰 강도와 횟수를 조절하세요.

    **주요 목표:** (분석된 약점 항목을 기반으로 훈련 목표 설정)

    **1주차: 기초 다지기**
    * **월:** (구체적인 훈련 내용과 시간/세트 제안)
    * **화:** (구체적인 훈련 내용)
    * **수:** 휴식 또는 가벼운 회복 운동
    * **목:** (구체적인 훈련 내용)
    * **금:** (구체적인 훈련 내용)
    * **토/일:** 휴식

    **2주차: 강도 높이기**
    * **월:** (1주차보다 강도를 높인 훈련 내용)
    * **화:** (1주차보다 강도를 높인 훈련 내용)
    * **수:** 휴식 또는 가벼운 회복 운동
    * **목:** (1주차보다 강도를 높인 훈련 내용)
    * **금:** (1주차보다 강도를 높인 훈련 내용)
    * **토/일:** 휴식

    **주의사항:**
    * 훈련 전 충분한 웜업, 훈련 후 쿨다운을 반드시 실시하세요.
    * 통증이 느껴질 경우 즉시 중단하고 전문가와 상의하세요.
    """

    try:
        response = model.generate_content(prompt)
        return jsonify({"result": response.text})
    except Exception as e:
        print(f"Gemini API 호출 중 오류 발생: {e}")
        return jsonify({"error": f"스케줄 생성 중 오류가 발생했습니다: {e}"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
