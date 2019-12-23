import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import createFirebaseToken from "../gubu_functions/createFirebaseToken";
const { config, Group } = require("solapi");

const credentials = functions.config().solapi;

// Firestore DB
const db = admin.firestore();

// Solapi SMS
config.init({
  apiKey: credentials.key,
  apiSecret: credentials.secret
});
async function sendSolapi(message: any, agent = {}) {
  await Group.sendSimpleMessage(message, agent);
}

export const verifyCustomToken = functions
  .region("asia-northeast1")
  .https.onRequest((req, res) => {
    const token = req.body.token;
    const provider = req.body.provider;
    if (!token)
      res
        .status(400)
        .send({ message: "ERROR: Access token is a required parameter." });

    createFirebaseToken({
      customAccessToken: token,
      provider: provider,
      admin: admin
    })
      .then((firebaseToken: any) => {
        console.log(`Returning firebase token to user: ${firebaseToken}`);
        res.send({ firebase_token: firebaseToken });
      })
      .catch(err => {
        res.status(400).send({ message: `ERROR: ${err}` });
      });
  });

// data: {number: 전화번호}
export const sendPhoneSMS = functions
  .region("asia-northeast1")
  .https.onCall(async (data, context) => {
    if (context === null || context.auth == null)
      return { success: false, error: "authentication" };
    const tempCode = Math.floor(Math.random() * 899999) + 100000;
    const userId = context.auth.uid;
    const userRef = db.doc(`users/${userId}`);

    return await sendSolapi({
      to: data.number,
      text: `[구부] 인증번호는 ${tempCode} 입니다`,
      from: credentials.from,
      type: "SMS"
    })
      .then(async _ => {
        return await userRef
          .collection("private_data")
          .doc("phone")
          .set(
            { tV: tempCode, createdAt: new Date(), phoneNumber: data.number },
            { merge: true }
          )
          .then(result => {
            return { success: true };
          })
          .catch(err => {
            return { success: false, error: "nouser", detail: err };
          });
      })
      .catch(err => {
        return { success: false, error: "smsfail", detail: err };
      });
  });

// data: {code: 인증번호}
export const verifySMSCode = functions
  .region("asia-northeast1")
  .https.onCall(async (data, context) => {
    if (context === null || !context.auth)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "죄송합니다. 회원가입을 다시 시작해주세요"
      );
    // return { success: false, error: "authentication" };
    const userId = context.auth.uid;
    const userRef = db.doc(`users/${userId}`);

    return await db
      .runTransaction(tx => {
        return tx
          .get(userRef.collection("private_data").doc("phone"))
          .then(async doc => {
            const docData = doc.data();
            if (docData === undefined || docData === null)
              throw new functions.https.HttpsError(
                "not-found",
                "죄송합니다. 회원가입을 다시 시작해주세요"
              );
            // { success: false, error: "nodata" };

            const date = new Date();
            const diff = date.getTime() - docData.createdAt.toDate().getTime();
            if (Math.round(diff / 1000 / 60) > 5)
              throw new functions.https.HttpsError(
                "deadline-exceeded",
                "인증 코드 유효기간이 지났습니다"
              );
            //  throw { success: false, error: "codeexpired" };

            if (docData.tV !== parseInt(data.code, 10))
              throw new functions.https.HttpsError(
                "permission-denied",
                "인증 코드가 맞지 않습니다"
              );
            // throw { success: false, error: "codenotequal" };

            if (context === null || !context.auth)
              throw new functions.https.HttpsError(
                "unauthenticated",
                "죄송합니다. 회원가입을 다시 시작해주세요"
              );

            await admin
              .auth()
              .updateUser(context.auth.uid, {
                phoneNumber: `+82${docData.phoneNumber}`
              })
              .catch(err => {
                if (err.errorInfo.code === "auth/phone-number-already-exists")
                  throw new functions.https.HttpsError(
                    "already-exists",
                    "이 번호로 이미 가입되어있는 계정이 있습니다"
                  );
                // throw { success: false, error: "alreadyexists" };
                throw new functions.https.HttpsError(
                  "internal",
                  "죄송합니다. 회원가입을 다시 시작해주세요",
                  err
                );
              });

            tx.update(userRef, { isVerified: true });
          })
          .then(_ => {
            return { success: true };
          })
          .catch(err => {
            throw err;
          });
      })
      .then(result => {
        return result;
      })
      .catch(err => {
        if (err === undefined)
          throw new functions.https.HttpsError(
            "unknown",
            "죄송합니다. 회원가입을 다시 시작해주세요"
          );
        throw err;
      });
  });

export const deleteUser = functions
  .region("asia-northeast1")
  .https.onCall(async (data, context) => {
    if (context === null || !context.auth) return false;
    return await admin
      .auth()
      .deleteUser(context.auth.uid)
      .then(_ => {
        return true;
      })
      .catch(err => {
        return false;
      });
  });

export const getProviderByEmail = functions
  .region("asia-northeast1")
  .https.onRequest((req, res) => {
    const email = req.body.email;

    admin
      .auth()
      .getUserByEmail(email)
      .then(user => {
        res
          .status(200)
          .send({ success: true, provider: user.uid.substring(0, 5) });
      })
      .catch(err => {
        if (err === undefined) {
          res
            .status(500)
            .send(
              new functions.https.HttpsError(
                "unknown",
                "네트워크가 불안정합니다. 나중에 다시 시도해주세요"
              )
            );
        } else {
          res.status(404).send(err);
        }
      });
  });

export const findUserEmail = functions
  .region("asia-northeast1")
  .https.onRequest((req, res) => {
    const name = req.body.displayName;
    const phone =
      req.body.phone.indexOf("+82") == 0
        ? req.body.phone
        : `+82${req.body.phone}`;

    admin
      .auth()
      .getUserByPhoneNumber(phone)
      .then(user => {
        if (user.displayName == name) {
          res.status(200).send({
            success: true,
            email: user.email,
            uid: user.uid.substring(0, 5)
          });
        } else {
          throw new functions.https.HttpsError(
            "not-found",
            "일치하는 회원정보가 없습니다"
          );
        }
      })
      .catch(err => {
        if (err === undefined) {
          res
            .status(500)
            .send(
              new functions.https.HttpsError(
                "unknown",
                "네트워크가 불안정합니다. 나중에 다시 시도해주세요"
              )
            );
        } else {
          res.status(404).send(err);
        }
      });
  });
