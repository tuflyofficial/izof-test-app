import os
import re
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

@app.route('/report')
def report():
    return render_template('report.html')

@app.after_request
def after_request(response):
    response.headers.pop('X-Frame-Options', None)
    return response

@app.route('/analyze', methods=['POST'])
def analyze():
    # ... 이전과 동일 ...
    if not model: return jsonify({"error": "API 키 미설정"}), 500
    data = request.json
    if not data or 'text' not in data: return jsonify({"error": "데이터 미전송"}), 400
    user_input = data['text']
    prompt = f"""전문가로서 IZOF 데이터를 분석. 입력된 항목을 보고 '멘탈/체력/기술' 중 해당하는 영역을 먼저 판단할 것. 분석은 아래 두 형식에 맞춰 순서대로, 간결하게 제시.
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
    **4. 실행 계획**: (실용적 훈련법 2~3가지)"""
    try:
        response = model.generate_content(prompt)
        return jsonify({"result": response.text})
    except Exception as e: return jsonify({"error": f"분석 오류: {e}"}), 500

# ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 프롬프트가 대폭 수정된 generate_schedule 함수 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
@app.route('/generate_schedule', methods=['POST'])
def generate_schedule():
    if not model: return jsonify({"error": "API 키 미설정"}), 500
    data = request.json
    # 이제 raw_data도 함께 받음
    if not all(k in data for k in ['analysis_text', 'raw_data']):
        return jsonify({"error": "분석 데이터가 부족합니다."}), 400

    analysis_text = data['analysis_text']
    raw_data = data['raw_data']

    prompt = f"""
    당신은 선수의 약점을 보완하기 위한 실행 계획을 제시하는 전문 코치입니다.
    아래에 주어진 **'1. 원본 데이터'**를 보고 주제('멘탈', '체력', '기술')를 명확히 판단한 후, '2. 1차 분석 결과'를 참고하여 구체적인 해결책을 제안하세요.

    --- 1. 원본 데이터 (주제 판단의 핵심 근거) ---
    {raw_data}

    --- 2. 1차 분석 결과 (참고 자료) ---
    {analysis_text}
    
    ---

    **지시사항:**
    1.  **'1. 원본 데이터'**의 항목들을 보고 주제를 판단하세요.
    2.  판단된 주제에 따라 아래 A, B 형식 중 하나로만 답변해야 합니다.
    3.  답변에 "터플라이 심리상담" 이라는 텍스트가 포함될 경우, 반드시 `<a href="https://www.tufly.co.kr/" target="_blank">터플라이 심리상담</a>` 와 같이 하이퍼링크를 삽입해야 합니다.

    ---
    **A) 주제가 '멘탈'일 경우:**

    ### 🧘 마음 챙김 및 멘탈 강화 프로그램
    멘탈적인 어려움은 혼자 해결하기보다 전문가와 함께하는 것이 효과적입니다. 아래는 스스로 시도해볼 수 있는 몇 가지 방법과 전문가를 찾을 수 있는 곳입니다.
    
    **1. 추천 멘탈 훈련 (2-3가지 제안):**
    * (1차 분석 결과를 바탕으로, 선수의 약점과 관련된 구체적인 멘탈 훈련 방법을 2-3가지 상세히 제안)

    **2. 전문가의 도움이 필요할 때:**
    * 혼자서 해결하기 어려운 문제라면, 주저하지 말고 전문가의 도움을 받는 것이 중요합니다.
    * 전문적인 심리 상담과 코칭은 **<a href="https://www.tufly.co.kr/" target="_blank">터플라이 심리상담</a>**을 통해 찾을 수 있습니다.

    ---
    **B) 주제가 '체력' 또는 '기술'일 경우:**

    ### 🏋️ 7일 집중 훈련 스케줄
    아래는 분석된 약점을 보완하기 위한 7일간의 샘플 훈련 스케줄입니다. 선수의 현재 컨디션에 맞춰 강도와 횟수를 조절하세요.

    **주요 목표:** (1차 분석 결과의 약점을 기반으로 훈련 목표 설정)

    * **1일차:** (구체적인 훈련 내용과 시간/세트 제안)
    * **2일차:** (구체적인 훈련 내용)
    * **3일차:** (구체적인 훈련 내용)
    * **4일차:** 휴식 또는 가벼운 회복 운동
    * **5일차:** (구체적인 훈련 내용)
    * **6일차:** (구체적인 훈련 내용)
    * **7일차:** 휴식 및 주간 점검

    **멘탈 팁:** 기술/체력 훈련 시에도 심리적 안정은 중요합니다. 훈련 중 어려운 순간에는 심호흡을 통해 평정심을 유지하는 연습을 병행해보세요. 더 깊은 도움이 필요하다면 **<a href="https://www.tufly.co.kr/" target="_blank">터플라이 심리상담</a>**의 문을 두드려보는 것도 좋은 방법입니다.
    """
    try:
        response = model.generate_content(prompt)
        return jsonify({"result": response.text})
    except Exception as e: return jsonify({"error": f"스케줄 생성 오류: {e}"}), 500
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ 프롬프트가 대폭 수정된 generate_schedule 함수 ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

@app.route('/summarize_all', methods=['POST'])
def summarize_all():
    # ... 이전과 동일 ...
    if not model: return jsonify({"error": "API 키 미설정"}), 500
    data = request.json
    if not all(k in data for k in ['raw_data', 'schedule_text', 'ai_insight_html']): return jsonify({"error": "리포트 데이터 부족"}), 400
    raw_data = data['raw_data']
    schedule_text = data['schedule_text']
    ai_insight_html = data['ai_insight_html']
    prompt = f"""
    당신은 주어진 정보들을 사용하여 깔끔한 HTML 보고서를 만드는 서식 전문가입니다. 아래 주어진 데이터들을 사용하여 하나의 완성된 HTML 리포트를 생성해주세요. **결과는 오직 HTML 코드만 포함해야 하며, 다른 설명은 절대 추가하지 마세요.**
    --- 1. 원본 데이터 ---
    {raw_data}
    --- 2. 훈련 계획 텍스트 ---
    {schedule_text}
    --- 3. 미리 생성된 AI Insight HTML ---
    {ai_insight_html}
    ---
    **지시사항:**
    1.  **헤더 생성:** 리포트의 가장 처음에 로고와 그 아래에 리포트 제목을 추가하세요.
        * 로고: `<img src="/static/logo3.png" alt="Tufly Logo" style="width:150px; display:block; margin: 0 auto 10px auto;">`
        * 제목: `<h2 style="text-align:center; margin-bottom:30px;">종합 리포트</h2>`
    2.  **검진 결과표 생성:** * 먼저 `<h3>📊 검진 결과표</h3>` 제목을 추가하세요.
        * '1. 원본 데이터'를 파싱하여, '항목', '이상적 상태', '현재 상태', '훈련 요구 점수' 4개의 열을 가진 `<table>` 형식의 HTML 표를 만드세요. '훈련 요구 점수'는 '이상적 상태' - '현재 상태' 값입니다.
    3.  **AI Insight 삽입:**
        * 결과표 바로 아래에, `<h3>💡 AI Insight</h3>` 제목을 추가하세요.
        * 그 아래에 '3. 미리 생성된 AI Insight HTML'의 내용을 그대로 삽입하세요.
    4.  **14일 훈련 계획표 생성:**
        * `<h3>📅 14일 맞춤 훈련 계획</h3>` 제목을 추가하세요.
        * '2. 훈련 계획 텍스트'의 내용을 14일짜리 `<table>` 형식의 HTML 표로 변환합니다.
        * 표의 헤더는 '일차', '훈련 내용'입니다.
        * 제공된 훈련 계획이 7일 분량이면, 나머지 8~14일은 '휴식', '자유 훈련', '주간 점검' 등으로 적절히 채워 14일짜리 표를 완성하세요.
    """
    try:
        response = model.generate_content(prompt)
        clean_html = re.sub(r'```html\n|```', '', response.text)
        return jsonify({"result": clean_html})
    except Exception as e:
        print(f"Gemini API 호출 중 오류 발생: {e}")
        return jsonify({"error": f"리포트 생성 오류: {e}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
