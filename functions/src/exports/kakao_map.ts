import * as functions from "firebase-functions";


// https://asia-northeast1-outsid-prealpha2.cloudfunctions.net/kakaoMap
export const kakaoMap = functions
    .region("asia-northeast1")
    .https.onRequest((req, res) => {
        res.send(`
            <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="utf-8">
                        <title>키워드로 장소검색하고 목록으로 표출하기</title>
                        <style>
                            html,
                            body {
                                margin: 0;
                                height: 100%;
                                overflow: hidden;
                            }

                            .map_wrap,
                            .map_wrap * {
                                margin: 0;
                                padding: 0;
                                font-family: 'Malgun Gothic', dotum, '돋움', sans-serif;
                                font-size: 12px;
                            }

                            .map_wrap a,
                            .map_wrap a:hover,
                            .map_wrap a:active {
                                color: #000;
                                text-decoration: none;
                            }

                            .map_wrap {
                                position: relative;
                                width: 100%;
                                height: 100%;
                            }

                            .bg_white {
                                background: #fff;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="map_wrap">
                            <div id="map" style="width:100%;height:100%;position:relative;overflow:hidden;"></div>
                        </div>
                    <script type="text/javascript">
                        function getUrlParams() {
                            var params = {};
                            const encodeQueryString = window.location.search;
                            const decodeQueryString = decodeURI(encodeQueryString);

                            decodeQueryString.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) {
                                params[key] = value;
                            });
                            return params;
                        }
                    </script>
                    <script type="text/javascript"
                        src="//dapi.kakao.com/v2/maps/sdk.js?appkey=c8f0096a6486d0d456622ce48fa20790&libraries=services"></script>
                    <script type="text/javascript">
                        oParam = getUrlParams();

                        // 장소 검색 객체를 생성합니다
                        var ps = new kakao.maps.services.Places();

                        //주소-좌표 변환 객체를 생성
                        var geocoder = new daum.maps.services.Geocoder();

                        // 마커를 담을 배열입니다
                        var markers = [];

                        var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
                            mapOption = {
                                center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
                                level: 3 // 지도의 확대 레벨
                            };

                        // 지도를 생성합니다    
                        var map = new kakao.maps.Map(mapContainer, mapOption);


                        if (!oParam.modifyMarker)
                            // 지도를 클릭했을때 클릭한 위치에 마커를 추가하도록 지도에 클릭이벤트를 등록합니다
                            kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
                                // 클릭한 위치에 마커를 표시합니다 
                                addMarker(mouseEvent.latLng);
                            });


                        function callbackPlaceMessage(message) {
                            try {
                                getPlace.postMessage(message);
                            } catch (err) { }
                        }

                        if (oParam.lat && oParam.lan) {
                            // 우편번호와 주소 정보를 해당 필드에 넣는다.

                            moveMapNMaker(oParam.lat, oParam.lan);
                        } else {
                            function callbackMessage(message) {
                                try {
                                    onSearchKeyword.postMessage(message);
                                } catch (err) { }
                            }

                            // 키워드로 장소를 검색합니다
                            searchPlaces(oParam.searchKeyword);
                        }


                        // 키워드 검색을 요청하는 함수입니다
                        function searchPlaces(searchKeyword) {

                            // 장소검색 객체를 통해 키워드로 장소검색을 요청합니다
                            ps.keywordSearch(searchKeyword, placesSearchCB);
                        }

                        // 장소검색이 완료됐을 때 호출되는 콜백함수 입니다
                        function placesSearchCB(data, status, pagination) {
                            if (status === kakao.maps.services.Status.OK) {

                                // 정상적으로 검색이 완료됐으면
                                // 검색 목록과 마커를 표출합니다
                                callbackMessage(JSON.stringify(data));
                            } else if (status === kakao.maps.services.Status.ZERO_RESULT) {

                                alert('검색 결과가 존재하지 않습니다.');
                                return;

                            } else if (status === kakao.maps.services.Status.ERROR) {

                                alert('검색 결과 중 오류가 발생했습니다.');
                                return;

                            }
                        }

                        // 마커를 생성하고 지도위에 표시하는 함수입니다
                        function addMarker(position) {
                            // 모든 마커 제거
                            removeMarker();

                            // 마커를 생성합니다
                            var marker = new kakao.maps.Marker({
                                position: position
                            });

                            // 마커가 지도 위에 표시되도록 설정합니다
                            marker.setMap(map);

                            // 생성된 마커를 배열에 추가합니다
                            markers.push(marker);
                        }

                        function displayMarker(place) {

                            // 마커를 생성하고 지도에 표시합니다
                            var marker = new kakao.maps.Marker({
                                map: map,
                                position: new kakao.maps.LatLng(place.y, place.x)
                            });

                            // 마커에 클릭이벤트를 등록합니다
                            kakao.maps.event.addListener(marker, 'click', function () {
                                // 마커를 클릭하면 장소명이 인포윈도우에 표출됩니다
                                infowindow.setContent('<div style="padding:5px;font-size:12px;">' + place.place_name + '</div>');
                                infowindow.open(map, marker);
                            });
                        }

                        // 지도 위에 표시되고 있는 마커를 모두 제거합니다
                        function removeMarker() {
                            for (var i = 0; i < markers.length; i++) {
                                markers[i].setMap(null);
                            }
                            markers = [];
                        }

                        function moveMapNMaker(lat, lan) {
                            var moveLatLon = new kakao.maps.LatLng(lat, lan);

                            // 지도 중심을 이동 시킵니다
                            map.setCenter(moveLatLon);
                            addMarker(moveLatLon);
                        }

                        // 키워드 검색을 요청하는 함수입니다
                        function getPlaceInfo() {
                            var marker = markers[0];
                            var moveLatLon = marker.getPosition();

                            geocoder.coord2Address(moveLatLon.getLng(), moveLatLon.getLat(), function (result, status) {
                                if (status === kakao.maps.services.Status.OK) {
                                    var saveData = result[0];
                                    saveData.lat = moveLatLon.getLat();
                                    saveData.lng = moveLatLon.getLng();

                                    callbackPlaceMessage(JSON.stringify(saveData));
                                }
                            });
                        }
                        </script>
                        <script src="//developers.kakao.com/sdk/js/kakao.min.js"></script>
                </body>
            </html>`);
    });