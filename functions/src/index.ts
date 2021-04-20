import * as admin from "firebase-admin";

// 주의사항
// 1. firebase use 로 내가 deploy하려는 채널, Branch일치 확인해야 함
// 2. branch에 따라 경로 달리 쓰는 부분 주의
//   2-1. 아래 serviceAccount, databaseURL
//   2-2. constant/index.ts에서 CONST.TEAMS
//   2-3. kakao_map.ts에서 kakaoAPIKEY

// release branch
var serviceAccount = require("../gubuapp-firebase-adminsdk-ache6-d79a8a8fa0.json");
var databaseURL = "https://gubuapp.firebaseio.com";

// master branch
// var serviceAccount = require("../outsid-prealpha2-firebase-adminsdk-1znb0-89055996f1.json");
// var databaseURL = "https://outsid-prealpha2.firebaseio.com";


// local
// var serviceAccount = require("../../../keys/outsid-prealpha2-4bf6c3ac1fd5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: databaseURL
});

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export {
  verifyCustomToken,
  sendPhoneSMS,
  verifySMSCode,
  deleteUser,
  findUserEmail,
  getProviderByEmail
} from "./exports/auth";

export {
  onCreateInviteFromAsc,
  onUpdateInviteFromAsc,
  onCreateInviteFromUser,
  onUpdateInviteFromUser,
  onDeleteInviteFromUser
} from "./exports/team_noti";

export { kakaoMap } from "./exports/kakao_map";

export { onUpdateActiveMembers } from "./exports/user_noti";
