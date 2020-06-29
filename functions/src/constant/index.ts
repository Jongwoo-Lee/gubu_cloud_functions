export const CONST = {
  DEFAULT_REGION: "asia-northeast1",
  USERS: "users",
  TEAMS: "teams_v4", // master: "teams_v4" , release: "teams"
  GAMES: "games",
  ASC: "asc",
  CUP: "cup",
  NOTIFICATION: "no",
  NO_VALIDATE: "v",
  TEAM_INACTIVE: "i",
  TEAM_INVITED_AT: "ia",
  CREATED_AT: "createdAt",
  TEAM_JOINED_AT: "joinedAt",
  MEMBER: "m",
  NOTI_NAME: "n",
  DISPLAYNAME: "displayName",
  TEAM_ACTIVE: "a",
  TEAM_ADMIN: "ad",
  SENDER_UID: "s",
  NOTI_TYPE: "nt",
  LATEST_NOTI: "ln",
  USER_JOINED_AT: "ujA",
  RECENT_SENDER: "rs",
  MEMBER_TEMP: "member_temporary",
  TEAMNAME: "teamname",
  NOTI_DATA: "nd",
  TEAM_LOGO: "team_logo",
};
export const NOTI_TYPE = {
  ADD_PLAYER_TO_TEAM: 0, // 선수가 팀 가입 요청을 할 때
  ADD_ASC_TO_TEAM: 1, // ASC 가 ASC로 팀 가입 요청을 할 때
};

export const USER_NOTI_TYPE = {
  MEMBER_ADDED_TO_TEAM: 0, // 0 팀 가입 승인 됐을때
  // 1 경기 일정 추가 됐을때
  // 2 경기 결과 추가 됐을때
  // 3 경기 결과에서 좋아요가 눌렸을때
  // 4 팀 번호 변경 됐을때
  // 5 팀에서 추방 됐을때
  // 6 대회 문서 제출이 필요할때
};
