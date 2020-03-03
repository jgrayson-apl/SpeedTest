/*
  Copyright 2020 Esri

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.​
*/

define([
  "calcite",
  "dojo/_base/declare",
  "esri/identity/IdentityManager",
  "esri/core/promiseUtils"
], function(calcite, declare, IdentityManager, promiseUtils){

  return declare([], {

    /**
     *
     */
    constructor: function(){

      // INITIALIZE CALCITE WEB //
      calcite.init();

      // INITIALIZE DOWNLOAD TEST //
      this.initializeDownloadTest();

      // INITIALISE SURVEY //
      this.initializeSurvey();

    },

    /**
     *  INITIALIZE SURVEY123 FORM AFTER CONNECTION SPEED TEST //
     */
    initializeSurvey: function(){

      // CONNECTION SPEED TEST //
      const speedTestBtn = document.getElementById("speed-test-btn");
      speedTestBtn.addEventListener("click", () => {

        // TEST CONNECTION SPEED //
        this.initiateSpeedDetection().then(({ speedMbps }) => {
          speedTestBtn.classList.add("btn-disabled");

          //
          // SURVEY123 WEB FORM //
          //
          const survey123WebForm = new Survey123WebForm({
            container: "survey123-webform",
            clientId: "Sv85I8dekRvelYpr",
            portalUrl: "https://www.arcgis.com",
            itemId: "4bc83b6adc8e48ae801c494764ac5fb1",
            onFormLoaded: (data) => {

              //
              // ANSWER INTERNET SPEED QUESTION WITH CONNECTION SPEED INFO //
              //
              survey123WebForm.setQuestionValue({ "internet_speed": speedMbps });

              // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API //
              if(navigator.geolocation){
                // GET LOCATION FROM BROWSER //
                navigator.geolocation.getCurrentPosition(position => {

                  // SET LOCATION //
                  survey123WebForm.setGeopoint({ x: position.coords.longitude, y: position.coords.latitude });

                }, () => { console.error('Unable to retrieve your location'); });
              } else {console.error('Geolocation is not supported by your browser'); }
            }
          });

          // SHOW SURVEY123 FORM //
          const surveyPanel = document.getElementById('survey-panel');
          surveyPanel.classList.remove('hide');

        });
      });

    },

    /**
     * BASED ON:
     *   https://stackoverflow.com/questions/5529718/how-to-detect-internet-speed-in-javascript
     *
     */
    initializeDownloadTest: function(){

      // DOWNLOAD IMAGE INFO //
      const downloadImageInfo = {
        imageUrl: "https://survey123.maps.arcgis.com/sharing/rest/content/items/4ce402d323d5491d98f2e4e184b68d4d/data",
        imageSizeBytes: 4710400
      };

      // SPEED TEST LABEL //
      const speedTestLabel = document.getElementById("speed-test-label");
      const showProgressMessage = msg => speedTestLabel.innerHTML = msg || "";

      //
      // INITIATE CONNECTION SPEED TEST BY MEASURING HOW LONG IT TAKES TO DOWNLOAD A FILE //
      //
      this.initiateSpeedDetection = () => {
        showProgressMessage("Speed test initiated, please wait...");
        return measureConnectionSpeed().then(speedInfo => {
          showProgressMessage(`Your connection speed is: ${speedInfo.speedMbps} Mbps`);
          return speedInfo;
        }, error => {
          showProgressMessage(`Error testing connection speed...: ${JSON.stringify(error)}`);
        });
      };

      // MEASURE CONNECTION SPEED //
      const measureConnectionSpeed = () => {
        return promiseUtils.create((resolve, reject) => {

          // CALCULATE DOWNLOAD SPEED //
          const calcSpeeds = (endTime) => {
            const duration = (endTime - startTime) / 1000;
            const bitsLoaded = (downloadImageInfo.imageSizeBytes * 8);
            const speedBps = (bitsLoaded / duration).toFixed(2);
            const speedKbps = (speedBps / 1024).toFixed(2);
            const speedMbps = (speedKbps / 1024).toFixed(2);

            return { speedBps, speedKbps, speedMbps };
          };

          // DOWNLOADED IMAGE //
          const downloadImage = new Image();
          downloadImage.onload = () => {
            // CALCULATE DOWNLOAD SPEED AND RESOLVE //
            resolve(calcSpeeds((new Date()).getTime()));
          };
          // ERROR DOWNLOADING IMAGE //
          downloadImage.onerror = (error, msg) => { reject(error); };

          // SET IMAGE SOURCE TO START DOWNLOAD //
          const startTime = (new Date()).getTime();
          downloadImage.src = `${downloadImageInfo.imageUrl}?cache_bust=${startTime}`;

        });
      };

    }

  });
});

