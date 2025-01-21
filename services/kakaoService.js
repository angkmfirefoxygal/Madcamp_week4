// const axios = require('axios');

// /**
//  * 카카오 사용자 정보 요청
//  * @param {string} accessToken - 사용자 액세스 토큰
//  * @returns {Object} 카카오 사용자 정보
//  */
// async function getUserInfo(accessToken) {
//   const url = 'https://kapi.kakao.com/v2/user/me';

//   try {
//     const response = await axios.get(url, {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
//       },
//     });

    
    
//     // 사용자 정보 추출
//     const { id, properties, kakao_account } = response.data;

//     const userInfo = {
//       kakaoId: id, // 사용자 고유 ID
//       nickname: properties?.nickname || null, // 닉네임
//       profile: properties?.profile_image || null, // 프로필 이미지
//       email: kakao_account?.email || null, // 이메일
//     };

//     console.log('카카오 사용자 정보:', userInfo); // 디버깅 로그
//     //return userInfo;
    
//     return response.data;
//   } catch (error) {
//     console.error('카카오 사용자 정보 요청 실패:', error.response?.data || error.message);
//     throw new Error('Failed to fetch Kakao user info');
//   }
// }

// module.exports = getUserInfo;
