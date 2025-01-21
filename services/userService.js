const User = require('../models/User');

/**
 * 사용자 데이터 저장 또는 업데이트
 * @param {Object} userInfo - 카카오 API에서 받은 사용자 정보
 * @returns {Object} 저장된 사용자 정보
 */
const saveOrUpdateUser = async (userInfo) => {
  try {
    // 카카오 사용자 ID로 사용자 검색
    const user = await User.findOne({ kakaoId: userInfo.kakaoId });

    if (user) {
      // 기존 사용자: 현재 데이터를 유지하고 새 정보만 업데이트
      user.nickname = userInfo.nickname || user.nickname;
      user.email = userInfo.email || user.email;
      user.profileImage = userInfo.profile || user.profileImage;
      user.updatedAt = new Date(); // 업데이트 시간 갱신

      // 기존 currentDay와 nextActivation 유지
      await user.save();
      console.log('사용자 정보 업데이트 완료:', user);
      return user;
    } else {
      // 새 사용자 생성
      const newUser = new User({
        kakaoId: userInfo.kakaoId,
        nickname: userInfo.nickname || null,
        email: userInfo.email || null,
        profileImage: userInfo.profile || null,
        currentDay: 0, // 새 사용자 초기화 값
        nextActivation: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedUser = await newUser.save();
      console.log('새 사용자 저장 완료:', savedUser);
      return savedUser;
    }
  } catch (error) {
    console.error('사용자 저장 중 오류 발생:', error.message);
    throw new Error('Failed to save user');
  }
};

module.exports = saveOrUpdateUser;
