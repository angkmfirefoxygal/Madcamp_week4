console.log("노드js 프로젝트 시작!!")
const session = require('express-session');
const dotenv = require('dotenv'); // dotenv 패키지 불러오기
// .env 파일 로드
dotenv.config();
const axios = require('axios');
// 환경 변수 설정 (client_id, redirect_uri)
const express = require('express');
const path = require('path');
const KAKAO_REDIRECT_URI = process.env.REDIRECT_URI 
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY 
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';


const connectDB = require('./db/connectDB'); // MongoDB 연결 파일
const userRoutes = require('./routes/users'); // 사용자 라우트
const User = require('./models/User'); // 정확한 경로 확인
const getUserInfo = require('./services/kakaoService'); // 카카오 API 요청 서비스
const saveOrUpdateUser = require('./services/userService'); // 사용자 데이터 저장 서비스


const app = express();
const PORT = 3000;
// MongoDB 연결
connectDB();

// 미들웨어
app.use(express.json());

// 사용자 라우트
app.use('/api/users', userRoutes);



// 세션 설정
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// API: 로그인 상태 확인
app.get('/api/login-status', (req, res) => {
  const isLoggedIn = req.session.isLoggedIn || false;
  res.json({ isLoggedIn });
});


// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, 'public')));

// 폰트 파일 제공 설정 (font 폴더)
app.use('/font', express.static(path.join(__dirname, 'font')));

// 메인 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vogue_copy.html')); // 기본 페이지로 'vogue_copy.html' 제공
  });

// 명시적 경로 설정 for self_test.html
app.get('/self_test.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'self_test.html'));
});


// Redirect URI에서 인가 코드 처리
app.get('/kakao-login', async(req, res) => {
    const authorizationCode = req.query.code; // ?code=abc123 형태로 전달된 인가 코드 가져오기
  
    if (!authorizationCode) {
      // 인가 코드가 없을 경우 에러 처리
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Kakao Login</title>
        </head>
        <body>
          <h1>Authorization Code Not Found</h1>
          <p>Something went wrong. Please try again.</p>
        </body>
        </html>
      `);
    }
  
    // 콘솔에 인가 코드 출력
    console.log("Authorization Code:", authorizationCode);
  

    try {
        // 카카오 토큰 API에 POST 요청
        const tokenResponse = await axios.post(
          KAKAO_TOKEN_URL,
          new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: KAKAO_REST_API_KEY,
            redirect_uri: KAKAO_REDIRECT_URI,
            code: authorizationCode,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
          }
        );

        const { access_token, refresh_token } = tokenResponse.data;
        
        
    
        console.log('Access Token:', access_token); // 서버 콘솔에 출력
        console.log('Refresh Token:', refresh_token);

          // 카카오 사용자 정보 요청 (직접 요청)
        const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        });
  
          // 사용자 정보 추출
          const { id, properties, kakao_account } = userInfoResponse.data;

          const userInfo = {
            kakaoId: id, // 사용자 고유 ID
            nickname: properties?.nickname || null, // 닉네임
            profile: properties?.profile_image || null, // 프로필 이미지
            email: kakao_account?.email || null, // 이메일
          };
      
          console.log('가져온 사용자 정보:', userInfo);
      
          


      // 로그인 상태 저장 (세션)
      req.session.isLoggedIn = true;  
      req.session.userId = userInfo.kakaoId; // kakaoId를 세션에 저장
      req.session.nickname = userInfo.nickname; // 닉네임 저장
      //req.session.accessToken = access_token; // 액세스 토큰 세션에 저장

        // 사용자 정보 저장 또는 업데이트
      const savedUser = await saveOrUpdateUser(userInfo);
      console.log('로그인 성공, 저장된 사용자 정보:', savedUser);
      

      console.log('로그인 성공! 세션 저장:', req.session);


    // 홈 페이지로 리디렉션
    res.redirect('/vogue_copy.html');
    } catch (error) {
    console.error('토큰 요청 중 오류 발생:', error.response?.data || error.message);
    res.redirect('/error.html');
    }

  });

// 로그아웃 처리
app.post('/logout', async (req, res) => {
  try {
    // 액세스 토큰 가져오기
    const accessToken = req.session.accessToken;

    if (accessToken) {
      // 카카오 로그아웃 API 호출
      const logoutResponse = await axios.post(
        'https://kapi.kakao.com/v1/user/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // 액세스 토큰 사용
          },
        }
      );

      console.log('카카오 로그아웃 성공:', logoutResponse.data);
    } else {
      console.log('액세스 토큰이 없습니다.');
    }
  } catch (error) {
    console.error('카카오 로그아웃 중 오류 발생:', error.response?.data || error.message);
  }

  // 세션 삭제 후 홈으로 리디렉션
  req.session.destroy((err) => {
    if (err) {
      console.error('세션 삭제 중 오류 발생:', err);
      return res.status(500).send('로그아웃 처리 중 오류가 발생했습니다.');
    }
    res.redirect('/'); // 홈으로 리디렉션
  });
});


// 출석체크 API
app.post('/api/check-in', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    // 현재 사용자 정보 가져오기
    const user = await User.findOne({ kakaoId: userId });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }


    const now = new Date();
    const nextActivation = new Date(user.nextActivation);

    // 다음 활성화 시간이 지났는지 확인
    if (now < nextActivation) {
      return res.status(400).json({ message: '출석 체크는 하루에 한 번만 가능합니다.' });
    }

    // currentDay 증가 및 nextActivation 갱신
    user.currentDay += 1;
    user.nextActivation = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    user.updatedAt = now;

    await user.save(); // 데이터베이스에 저장
    console.log(`출석 체크 성공: User ${user.kakaoId}, Day ${user.currentDay}`);

    return res.json({ message: '출석 체크 성공!', currentDay: user.currentDay,  buttonDisabled: true, });
  } catch (error) {
    console.error('출석 체크 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

app.get('/api/auth-status', (req, res) => {
  if (req.session.userId) {
    return res.json({ isLoggedIn: true });
  }
  res.json({ isLoggedIn: false });
});


app.get('/api/session', (req, res) => {
  if (req.session.isLoggedIn) {
    return res.json({
      isLoggedIn: true,
      userId: req.session.userId,
      nickname: req.session.nickname,
    });
  }

  res.json({ isLoggedIn: false });
});

app.get('/api/progress', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const user = await User.findOne({ kakaoId: userId });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    return res.json({
      currentDay: user.currentDay,
      buttonDisabled: new Date() < new Date(user.nextActivation),
    });
  } catch (error) {
    console.error("진행 상태 조회 중 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});



// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running at http://127.0.0.1:${PORT}`);
});
