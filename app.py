from flask import Flask, jsonify, request  # request를 추가
from pytrends.request import TrendReq
from flask_cors import CORS



app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def home():
    return "Flask API is running. Use /api/rankings to get search rankings."


# 실시간 연관 검색어 API 엔드포인트
@app.route('/api/trending', methods=['GET'])
def get_trending_searches():
    pytrends = TrendReq(hl='en-US', tz=360)
    try:
        # 특정 국가의 실시간 트렌드 검색어 가져오기 (South Korea)
        trending_searches_df = pytrends.trending_searches(pn='south_korea')
        trending_searches = trending_searches_df[0].tolist()[:10]  # 데이터프레임을 리스트로 변환
    except Exception as e:
        print(f"Error fetching trending searches: {e}")
        trending_searches = ["Error: Unable to fetch trending searches"]

    return jsonify(trending_searches)



if __name__ == '__main__':
    app.run(debug=True)
