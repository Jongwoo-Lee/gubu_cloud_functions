import * as admin from "firebase-admin";

// release branch
var serviceAccount = require("../gubuapp-firebase-adminsdk-ache6-d79a8a8fa0.json");

// master branch
// var serviceAccount = require("../outsid-prealpha2-firebase-adminsdk-1znb0-89055996f1.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://outsid-prealpha2.firebaseio.com"
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
