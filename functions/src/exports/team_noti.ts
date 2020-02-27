import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { CONST, NOTI_TYPE } from "../constant";

// Firestore DB
const db = admin.firestore();

const triggerInviteFromAsc = functions
  .region("asia-northeast1")
  .firestore.document(
    `${CONST.TEAMS_V4}/{teamId}/${CONST.TEAM_INVITE}/${CONST.ASC}`
  );

export const onCreateInviteFromAsc = triggerInviteFromAsc.onCreate(
  async (snap, context) => {
    const newValue = snap.data();
    const teamId = context.params.teamId;

    if (newValue !== undefined && teamId !== undefined) {
      // console.log(`onCreate trigger new value : ${JSON.stringify(newValue)}`);

      const teamRef = db
        .doc(`${CONST.TEAMS_V4}/${teamId}`)
        .collection(CONST.NOTIFICATION)
        .doc(CONST.TEAM_ADMIN);

      let notiData;

      for (const ascId in newValue) {
        if (newValue.hasOwnProperty(ascId)) {
          const seconds =
            newValue[ascId]._seconds * 1000 +
            Math.floor(newValue[ascId]._nanoseconds / 1000000);
          notiData = {
            [seconds]: {
              [CONST.SENDER_UID]: ascId,
              [CONST.NOTI_TYPE]: NOTI_TYPE.ADD_ASC_TO_TEAM
            }
          };
        }
      }

      if (notiData !== undefined) await teamRef.set(notiData, { merge: true });
    }
  }
);

export const onUpdateInviteFromAsc = triggerInviteFromAsc.onUpdate(
  async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const teamId = context.params.teamId;
    let notiData;
    // console.log(`onUpdate trigger new value: ${JSON.stringify(newValue)}`);
    // console.log(
    //   `onUpdate trigger previous value: ${JSON.stringify(previousValue)}`
    // );

    if (newValue !== undefined && teamId !== undefined) {
      const teamRef = db
        .doc(`${CONST.TEAMS_V4}/${teamId}`)
        .collection(CONST.NOTIFICATION)
        .doc(CONST.TEAM_ADMIN);

      for (const ascId in newValue) {
        if (newValue.hasOwnProperty(ascId)) {
          const newSeconds =
            newValue[ascId]._seconds * 1000 +
            Math.floor(newValue[ascId]._nanoseconds / 1000000);

          const prevSeconds =
            previousValue !== undefined && previousValue.hasOwnProperty(ascId)
              ? previousValue[ascId]._seconds * 1000 +
                Math.floor(previousValue[ascId]._nanoseconds / 1000000)
              : 0;

          if (newSeconds !== prevSeconds) {
            notiData = {
              [newSeconds]: {
                [CONST.SENDER_UID]: ascId,
                [CONST.NOTI_TYPE]: NOTI_TYPE.ADD_ASC_TO_TEAM
              },
              [prevSeconds]: admin.firestore.FieldValue.delete()
            };
          }
        }
      }

      if (notiData !== undefined) await teamRef.set(notiData, { merge: true });
    }
  }
);
