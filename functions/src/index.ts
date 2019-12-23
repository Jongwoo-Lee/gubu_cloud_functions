import * as admin from "firebase-admin";
admin.initializeApp();

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