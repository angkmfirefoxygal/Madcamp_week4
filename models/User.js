const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    kakaoId: { type: String, required: true, unique: true }, // 카카오 고유 ID
    nickname: { type: String, required: true }, // 닉네임
    email: { type: String, required: false }, // 이메일
    profileImage: { type: String }, // 프로필 이미지 URL
    currentDay: { type: Number },
    nextActivation: { type: Date, default: Date.now },
  },
  { timestamps: true } // createdAt, updatedAt 자동 추가
);

module.exports = mongoose.model('User', userSchema);
