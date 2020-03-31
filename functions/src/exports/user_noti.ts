import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { CONST, USER_NOTI_TYPE } from "../constant";
import { getTimeNumber } from "./team_noti";

// Firestore DB
const db = admin.firestore();

// class UserNoti {
//   public userId: string = "";
//   public type: number = -1;
//   public isRead: boolean = false;
//   public time: Date = new Date();
//   public senderName: string = "";
//   public senderId: string = "";
// }

// Team 에서 Active 멤버가 (team-a-m) 추가됐을때 동작
// NOTI_TYPE = ADD_ASC_TO_TEAM
// 1. team-no-adm document 에 Notification 추가
// 2. team document 에 Notification 시간 추가
const triggerActiveMembers = functions
  .region("asia-northeast1")
  .firestore.document(
    `${CONST.TEAMS}/{teamId}/${CONST.TEAM_ACTIVE}/${CONST.MEMBER}`
  );

export const onUpdateActiveMembers = triggerActiveMembers.onUpdate(
  async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const teamId = context.params.teamId;

    if (newValue !== undefined && teamId !== undefined) {
      // 초대 추가된 경우, 중복 초대한 경우
      for (const userId in newValue) {
        if (
          newValue.hasOwnProperty(userId) &&
          !userId.startsWith(CONST.MEMBER_TEMP) &&
          newValue[userId].hasOwnProperty(CONST.TEAM_JOINED_AT) &&
          previousValue !== undefined &&
          !previousValue.hasOwnProperty(userId)
        ) {
          const notiSeconds = getTimeNumber(
            newValue[userId][CONST.TEAM_JOINED_AT]
          );

          const userRef = db.doc(`users/${userId}`);
          const teamRef = db.doc(`${CONST.TEAMS}/${teamId}`);

          db.runTransaction(tx => {
            return tx.get(userRef).then(user => {
              const userDoc = user.data();
              if (userDoc === undefined || userDoc === null) return;

              // TODO: 100개 노티가 생길 경우 오래된 노티 삭제 - 따로 function 만들기
              const notis = userDoc[CONST.LATEST_NOTI];

              return tx.get(teamRef).then(team => {
                const teamDoc = team.data();
                if (teamDoc === undefined || teamDoc === null) return;

                const newNoti = {
                  [`${CONST.LATEST_NOTI}.${notiSeconds}`]: {
                    [CONST.NOTI_TYPE]: USER_NOTI_TYPE.MEMBER_ADDED_TO_TEAM,
                    [CONST.SENDER_UID]: teamId,
                    [CONST.NOTI_NAME]: teamDoc[CONST.TEAMNAME]
                  }
                };

                // 이전에 중복되는 팀 가입 승인 노티가 있는지 확인
                for (const sec in notis) {
                  if (
                    notis.hasOwnProperty(sec) &&
                    notis[sec][CONST.NOTI_TYPE] ===
                      USER_NOTI_TYPE.MEMBER_ADDED_TO_TEAM &&
                    notis[sec][CONST.SENDER_UID] === teamId
                  ) {
                    newNoti[sec] = admin.firestore.FieldValue.delete();
                  }
                }
                tx.update(userRef, newNoti);
              });
            });
          });
        }
      }
    }
  }
);
