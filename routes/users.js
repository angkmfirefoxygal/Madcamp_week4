const express = require('express');
const User = require('../models/User'); // 사용자 모델 가져오기
const getUserInfo = require('../services/kakaoService'); // 카카오 API 요청 서비스
const saveOrUpdateUser = require('../services/userService'); // 사용자 데이터 저장 서비스
const router = express.Router();

// 사용자 정보 요청 및 저장
router.post('/login', async (req, res) => {
    const { accessToken } = req.body; // 클라이언트에서 액세스 토큰 전달
  
    try {
      // 카카오 API에서 사용자 정보 가져오기
      const userInfo = await getUserInfo(accessToken);
  
      // 사용자 정보 DB에 저장 또는 업데이트
      const savedUser = await saveOrUpdateUser(userInfo);
  
      res.status(200).json({ message: 'Login successful', user: savedUser });
    } catch (error) {
      console.error('로그인 중 오류 발생:', error.message);
      res.status(500).json({ message: 'Login failed' });
    }
  });
  
  module.exports = router;