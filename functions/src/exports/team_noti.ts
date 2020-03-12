import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { CONST, NOTI_TYPE } from "../constant";

// Firestore DB
const db = admin.firestore();

// Association 에서 Invite(team-i-asc) 가 들어왔을때 동작
// 1. team-no-adm document 에 Notification 추가
// 2. team document 에 Notification 시간 추가
const triggerInviteFromAsc = functions
  .region("asia-northeast1")
  .firestore.document(
    `${CONST.TEAMS_V4}/{teamId}/${CONST.TEAM_INVITE}/${CONST.ASC}`
  );

const getTimeNumber = (date: { _seconds: number; _nanoseconds: number }) => {
  return date._seconds * 1000 + Math.floor(date._nanoseconds / 1000000);
};

export const onCreateInviteFromAsc = triggerInviteFromAsc.onCreate(
  async (snap, context) => {
    const newValue = snap.data();
    const teamId = context.params.teamId;

    if (newValue !== undefined && teamId !== undefined) {
      // console.log(`onCreate trigger new value : ${JSON.stringify(newValue)}`);

      const teamRef = db.doc(`${CONST.TEAMS_V4}/${teamId}`);
      const notiRef = teamRef
        .collection(CONST.NOTIFICATION)
        .doc(CONST.TEAM_ADMIN);

      let notiData, latestData;

      for (const ascId in newValue) {
        if (newValue.hasOwnProperty(ascId)) {
          const seconds = getTimeNumber(newValue[ascId]);
          // newValue[ascId]._seconds * 1000 +
          // Math.floor(newValue[ascId]._nanoseconds / 1000000);
          notiData = {
            [seconds]: {
              [CONST.SENDER_UID]: ascId,
              [CONST.NOTI_TYPE]: NOTI_TYPE.ADD_ASC_TO_TEAM
            }
          };

          latestData = {
            [`${CONST.LATEST_NOTI}.${seconds}`]: NOTI_TYPE.ADD_ASC_TO_TEAM
          };
        }
      }

      if (notiData !== undefined && latestData !== undefined) {
        let batch = db.batch();
        batch.update(teamRef, latestData);
        batch.set(notiRef, notiData, { merge: true });
        batch.commit();
      }
    }
  }
);

export const onUpdateInviteFromAsc = triggerInviteFromAsc.onUpdate(
  async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const teamId = context.params.teamId;
    let notiData, latestData;
    // console.log(`onUpdate trigger new value: ${JSON.stringify(newValue)}`);
    // console.log(
    //   `onUpdate trigger previous value: ${JSON.stringify(previousValue)}`
    // );

    if (newValue !== undefined && teamId !== undefined) {
      const teamRef = db.doc(`${CONST.TEAMS_V4}/${teamId}`);
      const notiRef = teamRef
        .collection(CONST.NOTIFICATION)
        .doc(CONST.TEAM_ADMIN);

      // 초대 추가된 경우, 중복 초대한 경우
      for (const ascId in newValue) {
        if (newValue.hasOwnProperty(ascId)) {
          const newSeconds = getTimeNumber(newValue[ascId]);
          // newValue[ascId]._seconds * 1000 +
          // Math.floor(newValue[ascId]._nanoseconds / 1000000);

          const prevSeconds =
            previousValue !== undefined && previousValue.hasOwnProperty(ascId)
              ? getTimeNumber(previousValue[ascId])
              : // previousValue[ascId]._seconds * 1000 +
                //   Math.floor(previousValue[ascId]._nanoseconds / 1000000)
                0;

          if (newSeconds !== prevSeconds) {
            notiData = {
              [newSeconds]: {
                [CONST.SENDER_UID]: ascId,
                [CONST.NOTI_TYPE]: NOTI_TYPE.ADD_ASC_TO_TEAM
              },
              [prevSeconds]: admin.firestore.FieldValue.delete()
            };
            latestData = {
              [`${CONST.LATEST_NOTI}.${newSeconds}`]: NOTI_TYPE.ADD_ASC_TO_TEAM,
              [`${CONST.LATEST_NOTI}.${prevSeconds}`]: admin.firestore.FieldValue.delete()
            };
          }
        }
      }

      // 초대 삭제한 경우
      if (notiData === undefined && latestData === undefined) {
        for (const ascId in previousValue) {
          if (
            previousValue.hasOwnProperty(ascId) &&
            !newValue.hasOwnProperty(ascId)
          ) {
            const prevSeconds = getTimeNumber(previousValue[ascId]);
            notiData = {
              [prevSeconds]: admin.firestore.FieldValue.delete()
            };
            latestData = {
              [`${CONST.LATEST_NOTI}.${prevSeconds}`]: admin.firestore.FieldValue.delete()
            };
          }
        }
      }
      if (notiData !== undefined && latestData !== undefined) {
        let batch = db.batch();
        batch.update(teamRef, latestData);
        batch.set(notiRef, notiData, { merge: true });
        batch.commit();
      } // await notiRef.set(notiData, { merge: true });
    }
  }
);
