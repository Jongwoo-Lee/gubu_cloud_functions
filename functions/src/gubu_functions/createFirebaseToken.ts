import * as request from "request-promise";

const KAKAO_APIURL = "https://kapi.kakao.com/v2/user/me";
const NAVER_APIURL = "https://openapi.naver.com/v1/nid/me";

const USERS = "users";

class UserInfo {
  public userId: string = "";
  public userEmail: string = "";
  public userName: string = "";
  public photoURL: string = "";
  public providerId: string = "";
}

const createFirebaseToken = ({
  customAccessToken,
  provider,
  admin
}: {
  customAccessToken: string;
  provider: string;
  admin: any;
}) => {
  let url = "";
  if (provider === "kakao") url = KAKAO_APIURL;
  else if (provider === "naver") url = NAVER_APIURL;

  return requestMe(customAccessToken, url)
    .then((res: any) => {
      const userInfo: UserInfo = new UserInfo();
      userInfo.providerId = provider;

      if (userInfo.providerId === "kakao") {
        userInfo.userId = `${userInfo.providerId}:${res.id}`;
        let email = res.kakao_account.email;
        if (email == undefined || email == null) {
          email = `${makeRandomEmail()}@kakao.com`;
        }

        let name = res.properties.nickname;
        if (name == undefined || name == null) {
          name = `익명`;
        }

        userInfo.userEmail = email;
        userInfo.userName = name;
        userInfo.photoURL = res.properties.profile_image;
      } else if (userInfo.providerId === "naver") {
        userInfo.userId = `${userInfo.providerId}:${res.response.id}`;
        let email = res.response.email;
        if (email == undefined || email == null) {
          email = `${makeRandomEmail()}@naver.com`;
        }

        let name = res.response.name;
        if (name == undefined || name == null) {
          name = `익명`;
        }

        userInfo.userEmail = email;
        userInfo.userName = name;
        userInfo.photoURL = res.response.profile_image;
      } else {
        return res
          .status(404)
          .send({ message: "No custom token provider exists." });
      }

      if (!userInfo.userId) {
        return res
          .status(404)
          .send({ message: "There was no user with the given access token." });
      }

      return updateOrCreateUser(admin, userInfo);
    })
    .then((userRecord: any) => {
      const userId = userRecord.uid;
      console.log(`creating a custom firebase token based on uid ${userId}`);
      return admin.auth().createCustomToken(userId);
    })
    .catch((error: any) => {
      console.log(`Error Catch - ${error}`);
    });
};

function requestMe(customAccessToken: string, url: string) {
  return request({
    method: "GET",
    headers: { Authorization: "Bearer " + customAccessToken },
    url: url,
    json: true
  });
}

function updateOrCreateUser(admin: any, userInfo: UserInfo) {
  console.log("updating or creating a firebase user");
  const updateParams = {
    uid: userInfo.userId,
    photoURL: userInfo.photoURL
  };

  return (
    admin
      .auth()
      //.createCustomToken(userInfo.userId)
      .updateUser(userInfo.userId, updateParams)
      .then((result: any) => {
        console.log(`${userInfo.userId} ++ ${result}`);
        return result;
      })
      .catch((error: any) => {
        //! 준학 error code 검색 후 에러문 추가할 것
        console.log(`${userInfo.userId} ++ ${error}`);
        if (error.code === "auth/user-not-found") {
          console.log("auth/user-not-found");
          const createParam = {
            providerId: userInfo.providerId,
            displayName: userInfo.userName,
            uid: userInfo.userId,
            email: userInfo.userEmail,
            photoURL: userInfo.photoURL
          };
          if (!userInfo.userName) {
            createParam["displayName"] = userInfo.userEmail;
          }

          createParam["uid"] = userInfo.userId;
          if (userInfo.userEmail) {
            createParam["email"] = userInfo.userEmail;
          }
          const userRecord = admin.auth().createUser(createParam);

          const firestore = admin.firestore();
          firestore
            .collection(USERS)
            .doc(userInfo.userId)
            .set({
              email: userInfo.userEmail,
              displayName: userInfo.userName,
              isVerified: false
            })
            .catch((err: any) => {
              throw err;
            });

          return userRecord;
        }
        throw error;
      })
  );
}

// https://github.com/firebase/firebase-js-sdk/blob/master/packages/firestore/src/util/misc.ts#L26
function makeRandomEmail() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let autoId = "generated_";
  for (let i = 0; i < 15; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // assert(autoId.length === 20, 'Invalid auto ID: ' + autoId);
  return autoId;
}

export default createFirebaseToken;
