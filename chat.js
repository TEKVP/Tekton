(function () {

  'use strict';
// ALL YOUR CHATBOT CODE
  // initTektonChat()
  // openChat()
  // closeChat()
  // submitLead()
  // menus
  // quotation flow
  // etc.


  /* ============================================================
     TEKTON ELEVATORS
     FREE HYBRID CHAT — STABLE V5
     ============================================================

     Current architecture:

       Customer
          ↓
       Main Menu
          ↓
       Topic / Lead Flow
          ↓
       Local Tekton Knowledge
          ↓
       Google Sheets for completed leads

     Gemini is NOT used.

     ============================================================ */


  var INIT_KEY =
    '__TEKTON_CHAT_STABLE_V6__';


  /*
   * Prevent duplicate initialization.
   */
  if (window[INIT_KEY]) {

    console.warn(
      'Tekton AI: already initialized.'
    );

    return;
  }


  window[INIT_KEY] = true;


  /* ============================================================
     INITIALIZATION
     ============================================================ */

  function initTektonChat() {

    var config =
      window.TEKTON_CHAT || {};


    var proxyUrl =
      String(
        config.proxyUrl || ''
      ).trim();


    var locationFile =
      String(
        config.locationFile ||
        './data/india-locations.json'
      );


    var knowledgeFile =
      String(
        config.knowledgeFile ||
        './data/tekton-knowledge.json'
      );


    var maxChars =
      Number(
        config.maxChars || 800
      );


    if (
      !isFinite(maxChars) ||
      maxChars < 100
    ) {

      maxChars = 800;

    }


    /* ==========================================================
       HTML ELEMENTS
       ========================================================== */

    var fabBtn =
      document.getElementById(
        'aiFabBtn'
      );


    var modal =
      document.getElementById(
        'aiLiftModal'
      );


    var closeBtn =
      document.getElementById(
        'aiChatClose'
      );


    var log =
      document.getElementById(
        'aiChatLog'
      );


    var form =
      document.getElementById(
        'aiChatForm'
      );


    var input =
      document.getElementById(
        'aiChatInput'
      );


    var sendBtn =
      document.getElementById(
        'aiChatSend'
      );


    if (
      !fabBtn ||
      !modal ||
      !closeBtn ||
      !log ||
      !form ||
      !input
    ) {

      console.error(
        'Tekton AI: required HTML elements are missing.'
      );

      return;

    }


    /* ==========================================================
       CONVERSATION STATE
       ========================================================== */

    var state =
      'main';


    var processing =
      false;


    var welcomeShown =
      false;


    var leadSaveInProgress =
      false;


    /* ==========================================================
       CUSTOMER DATA
       ========================================================== */

    var customerData = {

      requirement: '',

      capacity: '',

      floors: '',

      shaftSize: '',

      installationType: '',

      location: '',

      district: '',

      state: '',

      name: '',

      mobile: '',

      leadSaved: false

    };


    /* ==========================================================
       LOCAL DATA
       ========================================================== */

    var indiaLocations =
      [];


    var locationLoaded =
      false;


    var knowledge =
      null;


    var knowledgeLoaded =
      false;


    /* ==========================================================
       HELPERS
       ========================================================== */

    function normalise(
      value
    ) {

      return String(
        value == null
          ? ''
          : value
      )
        .toLowerCase()
        .replace(
          /\s+/g,
          ' '
        )
        .trim();

    }


    function normaliseLocation(
      value
    ) {

      return String(
        value == null
          ? ''
          : value
      )
        .toLowerCase()
        .replace(
          /[.,/\\()_\-]/g,
          ' '
        )
        .replace(
          /\s+/g,
          ' '
        )
        .trim();

    }


    function escapeHtml(
      value
    ) {

      return String(
        value == null
          ? ''
          : value
      )
        .replace(
          /&/g,
          '&amp;'
        )
        .replace(
          /</g,
          '&lt;'
        )
        .replace(
          />/g,
          '&gt;'
        )
        .replace(
          /"/g,
          '&quot;'
        )
        .replace(
          /'/g,
          '&#039;'
        );

    }


    /* ==========================================================
       MESSAGE DISPLAY
       ========================================================== */

    function appendMessage(
      role,
      text
    ) {

      var message =
        document.createElement(
          'div'
        );


      message.className =
        'tkmsg ' +
        (
          role === 'user'
            ? 'tkmsg--user'
            : 'tkmsg--bot'
        );


      var body =
        document.createElement(
          'div'
        );


      body.className =
        'tkmsg__body';


      body.innerHTML =
        escapeHtml(
          text
        )
          .replace(
            /\n/g,
            '<br>'
          );


      message.appendChild(
        body
      );


      log.appendChild(
        message
      );


      log.scrollTop =
        log.scrollHeight;

    }


    /* ==========================================================
       LOADING
       ========================================================== */

    function showLoading(
      text
    ) {

      removeLoading();


      var message =
        document.createElement(
          'div'
        );


      message.id =
        'aiLoadingMsg';


      message.className =
        'tkmsg tkmsg--bot';


      message.innerHTML =
        '<div class="tkmsg__body ai-loading-message">' +
          '<span class="ai-loading-dots">' +
            '<span></span>' +
            '<span></span>' +
            '<span></span>' +
          '</span>' +
          '<span>' +
            escapeHtml(
              text || 'Processing...'
            ) +
          '</span>' +
        '</div>';


      log.appendChild(
        message
      );


      log.scrollTop =
        log.scrollHeight;

    }


    function removeLoading() {

      var old =
        document.getElementById(
          'aiLoadingMsg'
        );


      if (old) {
        old.remove();
      }

    }
    /* COMPATIBILITY ALIAS */
function hideLoading() {
  removeLoading();
}


    /* ==========================================================
       PROCESS LOCK
       ========================================================== */

    function setProcessing(
      value
    ) {

      processing =
        !!value;


      input.disabled =
        processing;


      if (sendBtn) {

        sendBtn.disabled =
          processing;

      }

    }


    /* ==========================================================
       OPEN CHAT
       ========================================================== */

    function openChat() {

  /* =====================================================
     SHOW MODAL
     ===================================================== */

  modal.classList.add(
    'is-active'
  );

  modal.setAttribute(
    'aria-hidden',
    'false'
  );


  /* =====================================================
     RESET DOOR POSITION
     ===================================================== */

  modal.classList.remove(
    'doors-open'
  );


  /* =====================================================
     OPEN DOORS
     ===================================================== */

  window.setTimeout(
    function () {

      modal.classList.add(
        'doors-open'
      );

    },
    120
  );


  /* =====================================================
     FOCUS INPUT
     ===================================================== */

  window.setTimeout(
    function () {

      input.focus();

    },
    950
  );


  /* =====================================================
     FIRST GREETING
     ===================================================== */

  if (
    !welcomeShown
  ) {

    welcomeShown =
      true;

    window.setTimeout(
      function () {

        appendMessage(
          'bot',
          'Hi! Welcome to Tekton Elevators. How can I help you today?'
        );

        showMainMenu();

      },
      1050
    );

  }

}

    /* ==========================================================
       CLOSE CHAT
       ========================================================== */

    function closeChat() {

  /* =====================================================
     CLOSE DOORS
     ===================================================== */

  modal.classList.remove(
    'doors-open'
  );


  /* =====================================================
     WAIT FOR DOORS TO CLOSE
     ===================================================== */

  window.setTimeout(
    function () {

      modal.classList.remove(
        'is-active'
      );

      modal.setAttribute(
        'aria-hidden',
        'true'
      );

    },
    850
  );

}


    /* ==========================================================
       CHAT BUTTON WIRING
       ========================================================== */

    fabBtn.addEventListener(
      'click',
      function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (modal.classList.contains('is-active')) {
          return;
        }

        openChat();
      },
      false
    );

    closeBtn.addEventListener(
      'click',
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeChat();
      },
      false
    );

    document.addEventListener(
      'keydown',
      function (event) {
        if (
          event.key === 'Escape' &&
          modal.classList.contains('is-active')
        ) {
          closeChat();
        }
      },
      false
    );


    /* ==========================================================
       LOAD LOCATIONS
       ========================================================== */

    async function loadLocations() {

      if (
        locationLoaded
      ) {

        return indiaLocations;

      }


      try {

        var response =
          await fetch(
            locationFile +
            '?v=20260909-7',
            {
              method:
                'GET',

              cache:
                'no-store'
            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            'Location database HTTP ' +
            response.status
          );

        }


        var data =
          await response.json();


        if (
          data &&
          Array.isArray(
            data.locations
          )
        ) {

          indiaLocations =
            data.locations;

        } else {

          indiaLocations =
            [];

        }


        locationLoaded =
          true;


        console.log(
          'Tekton locations loaded:',
          indiaLocations.length
        );


      } catch (error) {

        console.error(
          'Tekton location database error:',
          error
        );


        indiaLocations =
          [];


        /*
         * Important:
         * Location loading failure must NOT
         * disable the chatbot.
         */

        locationLoaded =
          true;

      }


      return indiaLocations;

    }


    /* ==========================================================
       LOAD KNOWLEDGE
       ========================================================== */

    async function loadKnowledge() {

      if (
        knowledgeLoaded
      ) {

        return knowledge;

      }


      try {

        var response =
          await fetch(
            knowledgeFile +
            '?v=20260909-7',
            {
              method:
                'GET',

              cache:
                'no-store'
            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            'Knowledge database HTTP ' +
            response.status
          );

        }


        knowledge =
          await response.json();


      } catch (error) {

        console.error(
          'Tekton knowledge database error:',
          error
        );


        knowledge =
          {
            faq: []
          };

      }


      knowledgeLoaded =
        true;


      console.log(
        'Tekton knowledge loaded.'
      );


      return knowledge;

    }


    /* ==========================================================
       GENERIC MENU
       ========================================================== */

    function showMenu(
      options,
      includeBack
    ) {

      var wrapper =
        document.createElement(
          'div'
        );


      wrapper.className =
        'tkmsg tkmsg--bot tekton-menu-message';


      var body =
        document.createElement(
          'div'
        );


      body.className =
        'tkmsg__body';


      options.forEach(
        function (option) {

          var button =
            document.createElement(
              'button'
            );


          button.type =
            'button';


          button.className =
            'tekton-menu-btn';


          button.textContent =
            option.number +
            '. ' +
            option.label;


          button.addEventListener(
            'click',
            function () {

              if (
                processing
              ) {

                return;

              }


              /*
               * Disable the complete menu.
               */

              wrapper
                .querySelectorAll(
                  'button'
                )
                .forEach(
                  function (btn) {

                    btn.disabled =
                      true;

                  }
                );


              processUserMessage(
                option.number +
                '. ' +
                option.label
              );

            },
            false
          );


          body.appendChild(
            button
          );

        }
      );


      if (
        includeBack
      ) {

        var backButton =
          document.createElement(
            'button'
          );


        backButton.type =
          'button';


        backButton.className =
          'tekton-menu-btn tekton-menu-btn--back';


        backButton.textContent =
          '0. Main Menu';


        backButton.addEventListener(
          'click',
          function () {

            if (
              processing
            ) {

              return;

            }


            wrapper
              .querySelectorAll(
                'button'
              )
              .forEach(
                function (btn) {

                  btn.disabled =
                    true;

                }
              );


            processUserMessage(
              '0'
            );

          },
          false
        );


        body.appendChild(
          backButton
        );

      }


      wrapper.appendChild(
        body
      );


      log.appendChild(
        wrapper
      );


      log.scrollTop =
        log.scrollHeight;

    }


    /* ==========================================================
       MAIN MENU
       ========================================================== */

    function showMainMenu() {

      state =
        'main';


      appendMessage(
        'bot',
        'Please select what you would like to know:'
      );


      showMenu(
        [

          {
            number: '1',
            label: 'Lift Selection'
          },

          {
            number: '2',
            label: 'Shaft Planning'
          },

          {
            number: '3',
            label: 'Capacity'
          },

          {
            number: '4',
            label: 'Safety & Standards'
          },

          {
            number: '5',
            label: 'Maintenance / AMC'
          },

          {
            number: '6',
            label: 'Quotation'
          },

          {
            number: '7',
            label: 'Lift Designer'
          },

          {
            number: '8',
            label: 'Talk to Tekton Engineer'
          }

        ],
        false
      );

    }


    /* ==========================================================
       LIFT TYPE OPTIONS
       ========================================================== */

    var liftOptions = [

      {
        number:
          '1',

        label:
          'Home / Villa Lift'
      },

      {
        number:
          '2',

        label:
          'Passenger Lift'
      },

      {
        number:
          '3',

        label:
          'Hospital / Stretcher Lift'
      },

      {
        number:
          '4',

        label:
          'Goods / Freight Lift'
      },

      {
        number:
          '5',

        label:
          'Modernisation'
      },

      {
        number:
          '6',

        label:
          'Not sure — help me choose'
      }

    ];


    function parseLiftType(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '1' ||
        value.indexOf(
          'home / villa lift'
        ) !== -1 ||
        value.indexOf(
          'home lift'
        ) !== -1 ||
        value.indexOf(
          'home elevator'
        ) !== -1 ||
        value.indexOf(
          'villa lift'
        ) !== -1
      ) {

        return 'Home / Villa Lift';

      }


      if (
        value === '2' ||
        value.indexOf(
          'passenger lift'
        ) !== -1 ||
        value.indexOf(
          'passenger elevator'
        ) !== -1
      ) {

        return 'Passenger Lift';

      }


      if (
        value === '3' ||
        value.indexOf(
          'hospital lift'
        ) !== -1 ||
        value.indexOf(
          'stretcher lift'
        ) !== -1
      ) {

        return 'Hospital / Stretcher Lift';

      }


      if (
        value === '4' ||
        value.indexOf(
          'goods lift'
        ) !== -1 ||
        value.indexOf(
          'freight lift'
        ) !== -1
      ) {

        return 'Goods / Freight Lift';

      }


      if (
        value === '5' ||
        value.indexOf(
          'modernisation'
        ) !== -1 ||
        value.indexOf(
          'modernization'
        ) !== -1 ||
        value.indexOf(
          'retrofit'
        ) !== -1
      ) {

        return 'Modernisation';

      }


      if (
        value === '6' ||
        value.indexOf(
          'not sure'
        ) !== -1
      ) {

        return 'Not sure';

      }


      return '';

    }


    /* ==========================================================
       LIFT INFORMATION
       ========================================================== */

    function answerForLiftType(
      requirement
    ) {

      switch (
        requirement
      ) {

        case 'Home / Villa Lift':

          return (
            'Tekton provides residential and luxury home lifts. ' +
            'The suitable configuration depends on the available shaft, ' +
            'number of stops, capacity and site conditions.'
          );


        case 'Passenger Lift':

          return (
            'Tekton provides commercial passenger elevators. ' +
            'The final configuration depends on capacity, travel, traffic ' +
            'and site conditions.'
          );


        case 'Hospital / Stretcher Lift':

          return (
            'Tekton provides hospital and stretcher lift solutions. ' +
            'The final cabin, door arrangement and capacity depend on the project requirement.'
          );


        case 'Goods / Freight Lift':

          return (
            'Tekton provides goods and heavy-duty freight lift solutions. ' +
            'Capacity and configuration depend on the intended load and site conditions.'
          );


        case 'Modernisation':

          return (
            'Tekton provides lift modernisation and retrofitting for existing systems. ' +
            'The existing lift and site are assessed before preparing the engineering proposal.'
          );


        case 'Not sure':

          return (
            'No problem. Tekton can help select the appropriate lift based on the building, ' +
            'usage, capacity, floors and available shaft.'
          );

      }


      return '';

    }


    /* ==========================================================
       SHAFT MENU
       ========================================================== */

    function showShaftMenu() {

      state =
        'shaft';


      appendMessage(
        'bot',
        'You selected Shaft Planning. What would you like to know?'
      );


      showMenu(
        [

          {
            number:
              '1',

            label:
              'Shaft width & depth'
          },

          {
            number:
              '2',

            label:
              'Cabin size from shaft'
          },

          {
            number:
              '3',

            label:
              'Door opening'
          },

          {
            number:
              '4',

            label:
              'Pit & headroom planning'
          },

          {
            number:
              '5',

            label:
              'Use Lift Designer'
          }

        ],
        true
      );

    }


    async function handleShaft(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '0'
      ) {

        showMainMenu();

        return;

      }


      if (
        value === '1'
      ) {

        appendMessage(
          'bot',
          'Shaft requirements depend on the lift capacity, cabin, door arrangement and overall configuration. Tekton can prepare a site-specific design from the available shaft.'
        );

        return;

      }


      if (
        value === '2'
      ) {

        appendMessage(
          'bot',
          'Cabin size is determined from the shaft and selected lift configuration. Tekton uses site-specific engineering before fabrication.'
        );

        return;

      }


      if (
        value === '3'
      ) {

        appendMessage(
          'bot',
          'Tekton can use centre-opening or two-panel side-opening door arrangements. The final door size depends on the selected lift configuration.'
        );

        return;

      }


      if (
        value === '4'
      ) {

        appendMessage(
          'bot',
          'Pit depth and headroom are project-specific. Final dimensions should be confirmed by Tekton engineering for the selected lift arrangement.'
        );

        return;

      }


      if (
        value === '5'
      ) {

        appendMessage(
          'bot',
          'You can use the Tekton Lift Designer on this website to work from your available shaft width and depth.'
        );

        return;

      }


      appendMessage(
        'bot',
        'Please choose one of the Shaft Planning options.'
      );


      showShaftMenu();

    }


    /* ==========================================================
       CAPACITY
       ========================================================== */

    function showCapacityMenu() {

      state =
        'capacity';


      appendMessage(
        'bot',
        'You selected Capacity. What would you like to know?'
      );


      showMenu(
        [

          {
            number:
              '1',

            label:
              'How lift capacity is selected'
          },

          {
            number:
              '2',

            label:
              'I know my required capacity'
          },

          {
            number:
              '3',

            label:
              'Help me choose capacity'
          },

          {
            number:
              '4',

            label:
              'I am not sure'
          }

        ],
        true
      );

    }


    async function handleCapacity(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '0'
      ) {

        showMainMenu();

        return;

      }


      if (
        value === '1'
      ) {

        appendMessage(
          'bot',
          'Lift capacity depends on intended use, cabin size, shaft conditions, traffic and project requirements. Final capacity should be confirmed for the specific installation.'
        );

        return;

      }


      if (
        value === '2'
      ) {

        state =
          'capacityInput';


        appendMessage(
          'bot',
          'Please enter your required capacity, for example 6 passenger.'
        );

        return;

      }


      if (
        value === '3' ||
        value === '4'
      ) {

        startQuotationFlow();

        return;

      }


      if (
        /\d+\s*(?:passenger|person|people)/i.test(
          text
        )
      ) {

        customerData.capacity =
          text.trim();


        appendMessage(
          'bot',
          'Thank you. I have noted the required capacity as ' +
          text.trim() +
          '.'
        );


        state =
          'main';


        return;

      }


      appendMessage(
        'bot',
        'Please choose one of the Capacity options.'
      );


      showCapacityMenu();

    }


    function handleCapacityInput(
      text
    ) {

      var value =
        String(
          text || ''
        ).trim();


      if (
        normalise(value) === '0'
      ) {

        showMainMenu();

        return;

      }


      if (!value) {
        return;
      }


      customerData.capacity =
        value;


      appendMessage(
        'bot',
        'Thank you. I have noted the required capacity as ' +
        value +
        '.'
      );


      state =
        'main';

    }


    /* ==========================================================
       SAFETY
       ========================================================== */

    function showSafetyMenu() {

      state =
        'safety';


      appendMessage(
        'bot',
        'You selected Safety & Standards. What would you like to know?'
      );


      showMenu(
        [

          {
            number:
              '1',

            label:
              'IS 14665'
          },

          {
            number:
              '2',

            label:
              'Auto Rescue Device'
          },

          {
            number:
              '3',

            label:
              'General lift safety'
          },

          {
            number:
              '4',

            label:
              'Lift emergency'
          }

        ],
        true
      );

    }


    async function handleSafety(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '0'
      ) {

        showMainMenu();

        return;

      }


      if (
        value === '1'
      ) {

        appendMessage(
          'bot',
          'IS 14665 is relevant to electric traction lift safety guidance. Exact project requirements depend on the lift configuration and site conditions.'
        );

        return;

      }


      if (
        value === '2'
      ) {

        appendMessage(
          'bot',
          'Tekton states that Auto Rescue Device equipped systems are part of its safety approach.'
        );

        return;

      }


      if (
        value === '3'
      ) {

        appendMessage(
          'bot',
          'Safety is a core part of Tekton engineering. Applicable safety requirements depend on the lift configuration and project conditions.'
        );

        return;

      }


      if (
        value === '4'
      ) {

        appendMessage(
          'bot',
          'For a lift emergency, please call Tekton service at +91 89254 48131 immediately. Please do not force the lift doors open.'
        );

        return;

      }


      appendMessage(
        'bot',
        'Please choose one of the Safety & Standards options.'
      );


      showSafetyMenu();

    }


    /* ==========================================================
       MAINTENANCE
       ========================================================== */

    function showMaintenanceMenu() {

      state =
        'maintenance';


      appendMessage(
        'bot',
        'You selected Maintenance / AMC. What would you like to know?'
      );


      showMenu(
        [

          {
            number:
              '1',

            label:
              'AMC'
          },

          {
            number:
              '2',

            label:
              'Preventive maintenance'
          },

          {
            number:
              '3',

            label:
              'Emergency service'
          },

          {
            number:
              '4',

            label:
              'Existing lift maintenance'
          },

          {
            number:
              '5',

            label:
              'Modernisation'
          }

        ],
        true
      );

    }


    async function handleMaintenance(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '0'
      ) {

        showMainMenu();

        return;

      }


      if (
        value === '1'
      ) {

        appendMessage(
          'bot',
          'Tekton provides preventive Annual Maintenance Contracts and emergency support. The exact AMC scope depends on the installed lift and service requirement.'
        );

        return;

      }


      if (
        value === '2'
      ) {

        appendMessage(
          'bot',
          'Tekton provides preventive maintenance through its lifecycle service approach. The exact maintenance schedule depends on the installed system.'
        );

        return;

      }


      if (
        value === '3'
      ) {

        appendMessage(
          'bot',
          'For emergency service, please call Tekton at +91 89254 48131.'
        );

        return;

      }


      if (
        value === '4'
      ) {

        appendMessage(
          'bot',
          'Tekton can assess and support existing lift systems. The appropriate service depends on the existing equipment and site condition.'
        );

        return;

      }


      if (
        value === '5'
      ) {

        appendMessage(
          'bot',
          'Tekton provides lift modernisation and retrofitting for existing systems. The existing lift and site are assessed before preparing the engineering proposal.'
        );

        return;

      }


      appendMessage(
        'bot',
        'Please choose one of the Maintenance / AMC options.'
      );


      showMaintenanceMenu();

    }


    /* ==========================================================
       QUOTATION FLOW
       ========================================================== */

    function startQuotationFlow() {

      state =
        'quoteRequirement';


      appendMessage(
        'bot',
        'I can help collect the basic information needed for a Tekton quotation.'
      );


      appendMessage(
        'bot',
        'What type of lift are you looking for?'
      );


      showMenu(
        liftOptions,
        false
      );

    }


    function askQuoteCapacity() {

      state =
        'quoteCapacity';


      appendMessage(
        'bot',
        'What passenger capacity are you looking for? You can enter a capacity such as 6 passenger, or type "not sure".'
      );

    }


    function askQuoteFloors() {

      state =
        'quoteFloors';


      appendMessage(
        'bot',
        'How many floors or stops does the lift need to serve?'
      );

    }


    function askQuoteShaft() {

      state =
        'quoteShaft';


      appendMessage(
        'bot',
        'What is the approximate shaft width × depth? For example: 5 × 4.8 ft'
      );

    }


    function askInstallationType() {

      state =
        'quoteInstallation';


      appendMessage(
        'bot',
        'Is this a new lift or an existing lift project?'
      );


      showMenu(
        [

          {
            number:
              '1',

            label:
              'New installation'
          },

          {
            number:
              '2',

            label:
              'Existing lift replacement'
          },

          {
            number:
              '3',

            label:
              'Modernisation'
          },

          {
            number:
              '4',

            label:
              'Not sure'
          }

        ],
        false
      );

    }


    function askLocation() {

      state =
        'quoteLocation';


      /*
       * Load location data in the background.
       */

      loadLocations();


      appendMessage(
        'bot',
        'Which city or location is the project in?'
      );

    }


    function askName() {

      state =
        'quoteName';


      appendMessage(
        'bot',
        'May I have your name?'
      );

    }


    function askMobile() {

      state =
        'quoteMobile';


      appendMessage(
        'bot',
        'What mobile number can our team use to contact you?'
      );

    }


    /* ==========================================================
       NUMBER / FLOORS
       ========================================================== */

    function extractFloors(
      text
    ) {

      var value =
        String(
          text || ''
        ).trim();


      if (
        /^\d+$/.test(
          value
        )
      ) {

        var number =
          Number(
            value
          );


        if (
          number >= 1 &&
          number <= 200
        ) {

          return value;

        }

      }


      var match =
        value.match(
          /(\d+)\s*(?:floor|floors|storey|storeys|story|stories|stop|stops)/i
        );


      return (
        match &&
        match[1]
      )
        ? match[1]
        : '';

    }


    /* ==========================================================
       SHAFT
       ========================================================== */

    function extractShaft(
      text
    ) {

      var match =
        String(
          text || ''
        ).match(
          /(\d+(?:\.\d+)?)\s*(?:ft|feet|mm|m)?\s*[x×*]\s*(\d+(?:\.\d+)?)\s*(ft|feet|mm|m)?/i
        );


      if (!match) {
        return '';
      }


      var unit =
        match[3]
          ? ' ' + match[3]
          : '';


      return (
        match[1] +
        ' × ' +
        match[2] +
        unit
      ).trim();

    }


    /* ==========================================================
       MOBILE
       ========================================================== */

    function extractPhone(
      text
    ) {

      var match =
        String(
          text || ''
        ).match(
          /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/
        );


      if (!match) {
        return '';
      }


      return match[0]
        .replace(
          /\D/g,
          ''
        )
        .replace(
          /^91/,
          ''
        )
        .slice(
          -10
        );

    }


    /* ==========================================================
       NAME
       ========================================================== */

    function extractName(
      text
    ) {

      var value =
        String(
          text || ''
        ).trim();


      /*
       * Explicit:
       * My name is Marikannan
       * I am Marikannan
       */

      var explicit =
        value.match(
          /(?:my name is|my name's|i am|i'm|this is|name is)\s*[:\-]?\s*([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3})/i
        );


      if (
        explicit &&
        explicit[1]
      ) {

        return explicit[1]
          .trim()
          .replace(
            /[.,!?]+$/,
            ''
          );

      }


      /*
       * Direct name entry is allowed ONLY
       * when the current state is quoteName.
       */

      if (
        state === 'quoteName' &&
        /^[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3}$/.test(
          value
        )
      ) {

        var blocked =
          [

            'hi',
            'hello',
            'hey',
            'thanks',
            'thank you',
            'okay',
            'ok',
            'lift',
            'elevator',
            'selection',
            'capacity',
            'service',
            'quotation',
            'quote',
            'price',
            'cost',
            'shaft',
            'chennai',
            'sivakasi',
            'kovilpatti',
            'tenkasi',
            'bengaluru',
            'bangalore'

          ];


        if (
          blocked.indexOf(
            normalise(
              value
            )
          ) === -1
        ) {

          return value;

        }

      }


      return '';

    }


    /* ==========================================================
       LOCATION
       ========================================================== */

    async function findLocation(
      text
    ) {

      await loadLocations();


      var source =
        normaliseLocation(
          text
        );


      if (!source) {
        return null;
      }


      /*
       * First try the location database.
       */

      for (
        var i = 0;
        i < indiaLocations.length;
        i++
      ) {

        var item =
          indiaLocations[i];


        var names =
          [
            item.name
          ];


        if (
          Array.isArray(
            item.aliases
          )
        ) {

          names =
            names.concat(
              item.aliases
            );

        }


        for (
          var j = 0;
          j < names.length;
          j++
        ) {

          var candidate =
            normaliseLocation(
              names[j]
            );


          if (
            source === candidate ||
            source.indexOf(
              candidate
            ) !== -1
          ) {

            return {

              name:
                item.name,

              district:
                item.district || '',

              state:
                item.state || ''

            };

          }

        }

      }


      /*
       * Sentence formats.
       */

      var patterns =
        [

          /^(.+?)\s+is\s+(?:the\s+)?location$/i,

          /(?:location|city|place|project location|site location)\s*(?:is|:|-)?\s*(.+)$/i,

          /(?:located in|project is in|site is in|from)\s+(.+)$/i

        ];


      for (
        var p = 0;
        p < patterns.length;
        p++
      ) {

        var match =
          String(
            text || ''
          ).match(
            patterns[p]
          );


        if (
          match &&
          match[1]
        ) {

          return {

            name:
              match[1]
                .trim()
                .replace(
                  /[.,!?]+$/,
                  ''
                ),

            district:
              '',

            state:
              ''

          };

        }

      }


      /*
       * At location step, accept any
       * customer-provided place.
       */

      if (
        state === 'quoteLocation' &&
        source.length >= 2
      ) {

        return {

          name:
            String(
              text || ''
            ).trim(),

          district:
            '',

          state:
            ''

        };

      }


      return null;

    }


    /* ==========================================================
       MAIN MENU HANDLER
       ========================================================== */

    async function handleMain(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '0' ||
        value === 'menu' ||
        value === 'main menu'
      ) {

        showMainMenu();

        return;

      }


      /*
       * 1 Lift Selection
       */

      if (
        value === '1' ||
        value.indexOf(
          'lift selection'
        ) !== -1
      ) {

        showLiftSelectionMenu();

        return;

      }


      /*
       * 2 Shaft
       */

      if (
        value === '2' ||
        value.indexOf(
          'shaft planning'
        ) !== -1
      ) {

        showShaftMenu();

        return;

      }


      /*
       * 3 Capacity
       */

      if (
        value === '3' ||
        value === 'capacity'
      ) {

        showCapacityMenu();

        return;

      }


      /*
       * 4 Safety
       */

      if (
        value === '4' ||
        value.indexOf(
          'safety'
        ) !== -1 ||
        value.indexOf(
          'standards'
        ) !== -1
      ) {

        showSafetyMenu();

        return;

      }


      /*
       * 5 Maintenance
       */

      if (
        value === '5' ||
        value.indexOf(
          'maintenance'
        ) !== -1 ||
        value === 'amc'
      ) {

        showMaintenanceMenu();

        return;

      }


      /*
       * 6 Quotation
       */

      if (
        value === '6' ||
        value.indexOf(
          'quotation'
        ) !== -1 ||
        value.indexOf(
          'quote'
        ) !== -1 ||
        value.indexOf(
          'price'
        ) !== -1 ||
        value.indexOf(
          'cost'
        ) !== -1
      ) {

        startQuotationFlow();

        return;

      }


      /*
       * 7 Designer
       */

      if (
        value === '7' ||
        value.indexOf(
          'designer'
        ) !== -1
      ) {

        appendMessage(
          'bot',
          'You can use the Tekton Lift Designer on this website to create a shaft and cabin plan.'
        );

        return;

      }


      /*
       * 8 Engineer
       */

      if (
        value === '8' ||
        value.indexOf(
          'engineer'
        ) !== -1
      ) {

        startQuotationFlow();

        return;

      }


      /*
       * Direct project request.
       */

      if (
        looksLikeProject(
          value
        )
      ) {

        startQuotationFlow();

        return;

      }


      /*
       * Greeting.
       */

      if (
        /^(hi|hello|hey|good morning|good afternoon|good evening|good day)[!. ]*$/.test(
          value
        )
      ) {

        appendMessage(
          'bot',
          'Hello! Welcome to Tekton Elevators. How can I help you today?'
        );


        showMainMenu();

        return;

      }


      /*
       * Knowledge.
       */

      var answer =
        await localKnowledgeAnswer(
          text
        );


      if (
        answer
      ) {

        appendMessage(
          'bot',
          answer
        );

        return;

      }


      /*
       * Unknown.
       */

      appendMessage(
        'bot',
        'Please choose a topic from the menu below, or tell me about your lift requirement.'
      );


      showMainMenu();

    }


    function looksLikeProject(
      value
    ) {

      var phrases =
        [

          'need a lift',

          'need an elevator',

          'want a lift',

          'want an elevator',

          'looking for a lift',

          'looking for an elevator',

          'lift enquiry',

          'lift inquiry',

          'lift requirement',

          'for my house',

          'for my home',

          'for my building',

          'get a quotation',

          'need quotation',

          'need a quotation',

          'want quotation',

          'get a quote',

          'need a quote'

        ];


      for (
        var i = 0;
        i < phrases.length;
        i++
      ) {

        if (
          value.indexOf(
            phrases[i]
          ) !== -1
        ) {

          return true;

        }

      }


      return false;

    }


    /* ==========================================================
       LIFT SELECTION MENU
       ========================================================== */

    function showLiftSelectionMenu() {

      state =
        'liftSelection';


      appendMessage(
        'bot',
        'You selected Lift Selection. What type of lift are you considering?'
      );


      showMenu(
        liftOptions,
        true
      );

    }


    async function handleLiftSelection(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '0'
      ) {

        showMainMenu();

        return;

      }


      var requirement =
        parseLiftType(
          text
        );


      if (
        requirement
      ) {

        customerData.requirement =
          requirement;


        appendMessage(
          'bot',
          'You selected ' +
          requirement +
          '.'
        );


        state =
          'liftSelectionAction';


        appendMessage(
          'bot',
          'What would you like to do next?'
        );


        showMenu(
          [

            {
              number:
                '1',

              label:
                'Tell me about this lift'
            },

            {
              number:
                '2',

              label:
                'Prepare a quotation'
            }

          ],
          true
        );


        return;

      }


      appendMessage(
        'bot',
        'Please select one of the lift types.'
      );


      showLiftSelectionMenu();

    }


    async function handleLiftSelectionAction(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '0'
      ) {

        showMainMenu();

        return;

      }


      if (
        value === '1'
      ) {

        appendMessage(
          'bot',
          answerForLiftType(
            customerData.requirement
          )
        );


        appendMessage(
          'bot',
          'Please choose another topic from the Main Menu when you are ready.'
        );


        state =
          'main';


        return;

      }


      if (
        value === '2'
      ) {

        startQuotationFlow();

        return;

      }


      appendMessage(
        'bot',
        'Please choose 1 for information or 2 for a quotation.'
      );

    }


    /* ==========================================================
       LOCAL KNOWLEDGE
       ========================================================== */

    async function localKnowledgeAnswer(
      text
    ) {

      await loadKnowledge();


      var value =
        normalise(
          text
        );


      /*
       * Emergency always wins.
       */

      if (
        value.indexOf(
          'trapped'
        ) !== -1 ||
        value.indexOf(
          'stuck in lift'
        ) !== -1 ||
        value.indexOf(
          'stuck in elevator'
        ) !== -1 ||
        value.indexOf(
          'emergency'
        ) !== -1 ||
        value.indexOf(
          'accident'
        ) !== -1
      ) {

        return (
          'For a lift emergency, please call Tekton service at ' +
          '+91 89254 48131 immediately. Please do not force the lift doors open.'
        );

      }


      if (
        value.indexOf(
          'phone number'
        ) !== -1 ||
        value.indexOf(
          'contact number'
        ) !== -1 ||
        value.indexOf(
          'contact details'
        ) !== -1
      ) {

        return (
          'You can contact Tekton Elevators at +91 89254 48131 or +91 95001 58530.'
        );

      }


      if (
        value === 'email' ||
        value.indexOf(
          'email address'
        ) !== -1 ||
        value.indexOf(
          'email id'
        ) !== -1
      ) {

        return (
          'You can email Tekton Elevators at info@tektonelevators.com.'
        );

      }


      if (
        value.indexOf(
          'where are you'
        ) !== -1 ||
        value.indexOf(
          'where is tekton'
        ) !== -1 ||
        value.indexOf(
          'office'
        ) !== -1 ||
        value.indexOf(
          'branch'
        ) !== -1
      ) {

        return (
          'Tekton Elevators is based in Kovilpatti, with a branch in Tenkasi and project and service coverage in Chennai and Bengaluru.'
        );

      }


      /*
       * FAQ from tekton-knowledge.json.
       */

      if (
        knowledge &&
        Array.isArray(
          knowledge.faq
        )
      ) {

        for (
          var i = 0;
          i < knowledge.faq.length;
          i++
        ) {

          var faq =
            knowledge.faq[i];


          if (
            !Array.isArray(
              faq.keywords
            )
          ) {
            continue;
          }


          for (
            var j = 0;
            j < faq.keywords.length;
            j++
          ) {

            var keyword =
              normalise(
                faq.keywords[j]
              );


            if (
              keyword &&
              value.indexOf(
                keyword
              ) !== -1
            ) {

              return faq.answer;

            }

          }

        }

      }


      return '';

    }


    /* ==========================================================
       QUOTATION STEP — REQUIREMENT
       ========================================================== */

    async function handleQuoteRequirement(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '0'
      ) {

        showMainMenu();

        return;

      }


      var requirement =
        parseLiftType(
          text
        );


      if (
        requirement
      ) {

        customerData.requirement =
          requirement;


        appendMessage(
          'bot',
          'You selected ' +
          requirement +
          '.'
        );


        askQuoteCapacity();

        return;

      }


      appendMessage(
        'bot',
        'Please select one of the lift types below.'
      );


      showMenu(
        liftOptions,
        false
      );

    }


    /* ==========================================================
       QUOTATION — CAPACITY
       ========================================================== */

    async function handleQuoteCapacity(
      text
    ) {

      if (
        normalise(text) === '0'
      ) {

        showMainMenu();

        return;

      }


      var value =
        String(
          text || ''
        ).trim();


      if (
        !value
      ) {
        return;
      }


      customerData.capacity =
        value;


      askQuoteFloors();

    }


    /* ==========================================================
       QUOTATION — FLOORS
       ========================================================== */

    async function handleQuoteFloors(
      text
    ) {

      if (
        normalise(text) === '0'
      ) {

        showMainMenu();

        return;

      }


      var floors =
        extractFloors(
          text
        );


      if (
        floors
      ) {

        customerData.floors =
          floors;


        askQuoteShaft();

        return;

      }


      appendMessage(
        'bot',
        'Please enter the number of floors or stops, for example 3.'
      );

    }


    /* ==========================================================
       QUOTATION — SHAFT
       ========================================================== */

    async function handleQuoteShaft(
      text
    ) {

      if (
        normalise(text) === '0'
      ) {

        showMainMenu();

        return;

      }


      var shaft =
        extractShaft(
          text
        );


      if (
        shaft
      ) {

        customerData.shaftSize =
          shaft;


        askInstallationType();

        return;

      }


      appendMessage(
        'bot',
        'Please enter the shaft width × depth, for example 5 × 4.8 ft.'
      );

    }


    /* ==========================================================
       QUOTATION — INSTALLATION
       ========================================================== */

    async function handleQuoteInstallation(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '0'
      ) {

        showMainMenu();

        return;

      }


      if (
        value === '1'
      ) {

        customerData.installationType =
          'New installation';


        askLocation();

        return;

      }


      if (
        value === '2'
      ) {

        customerData.installationType =
          'Existing lift replacement';


        askLocation();

        return;

      }


      if (
        value === '3'
      ) {

        customerData.installationType =
          'Modernisation';


        askLocation();

        return;

      }


      if (
        value === '4'
      ) {

        customerData.installationType =
          'Not sure';


        askLocation();

        return;

      }


      appendMessage(
        'bot',
        'Please choose one of the installation options.'
      );


      askInstallationType();

    }


    /* ==========================================================
       QUOTATION — LOCATION
       ========================================================== */

    async function handleQuoteLocation(
      text
    ) {

      var location =
        await findLocation(
          text
        );


      if (
        location &&
        location.name
      ) {

        customerData.location =
          location.name;

        customerData.district =
          location.district;

        customerData.state =
          location.state;


        askName();

        return;

      }


      appendMessage(
        'bot',
        'Please enter the project city or location.'
      );

    }


    /* ==========================================================
       QUOTATION — NAME
       ========================================================== */

    async function handleQuoteName(
      text
    ) {

      var name =
        extractName(
          text
        );


      if (
        name
      ) {

        customerData.name =
          name;


        appendMessage(
          'bot',
          'Thank you, ' +
          name +
          '.'
        );


        askMobile();

        return;

      }


      appendMessage(
        'bot',
        'Please enter your name, for example Marikannan.'
      );

    }


    /* ==========================================================
       QUOTATION — MOBILE
       ========================================================== */

    async function handleQuoteMobile(
      text
    ) {

      var mobile =
        extractPhone(
          text
        );


      if (
        mobile
      ) {

        customerData.mobile =
          mobile;


        await submitLead();


        return;

      }


      appendMessage(
        'bot',
        'Please enter a valid 10-digit Indian mobile number.'
      );

    }


    /* ==========================================================
       LEAD SUBMISSION
       ========================================================== */

    function fetchWithTimeout(
      url,
      options,
      timeout
    ) {

      if (
        typeof AbortController ===
        'undefined'
      ) {

        return fetch(
          url,
          options
        );

      }


      var controller =
        new AbortController();


      var timer =
        window.setTimeout(
          function () {

            controller.abort();

          },
          timeout
        );


      var requestOptions =
        Object.assign(
          {},
          options,
          {
            signal:
              controller.signal
          }
        );


      return fetch(
        url,
        requestOptions
      )
        .finally(
          function () {

            clearTimeout(
              timer
            );

          }
        );

    }


    async function submitLead() {

      if (
        customerData.leadSaved ||
        leadSaveInProgress
      ) {

        return true;

      }


      if (
        !customerData.name ||
        !customerData.mobile ||
        !customerData.location
      ) {

        return false;

      }


      if (
        !proxyUrl
      ) {

        appendMessage(
          'bot',
          'Your project details are complete, but the enquiry connection is not configured.'
        );


        return false;

      }


      /*
       * IMPORTANT:
       * Lock BEFORE starting the request.
       */

      leadSaveInProgress =
        true;


      try {

        showLoading(
          'Submitting enquiry...'
        );


        var response =
          await fetchWithTimeout(
            proxyUrl,
            {

              method:
                'POST',

              headers:
                {
                  'Content-Type':
                    'text/plain;charset=utf-8'
                },

              body:
                JSON.stringify({

                  action:
                    'lead',

                  sheetSource:
                    'Drawing_Leads',

                  clientName:
                    customerData.name,

                  clientPhone:
                    customerData.mobile,

                  siteLocation:
                    customerData.location,

                  floors:
                    customerData.floors,

                  shaftSize:
                    customerData.shaftSize,

                  requirement:
                    customerData.requirement,

                  capacity:
                    customerData.capacity,

                  installationType:
                    customerData.installationType

                })

            },
            12000
          );


        var raw =
          await response.text();


        var data =
          {};


        try {

          data =
            JSON.parse(
              raw || '{}'
            );

        } catch (parseError) {

          data =
            {};

        }


        console.log(
          'Tekton lead response:',
          data
        );


        hideLoading();


        if (
          response.ok &&
          data.ok === true
        ) {

          customerData.leadSaved =
            true;


          state =
            'saved';


          appendMessage(
            'bot',
            'Thank you, ' +
            customerData.name +
            '. Your enquiry has been recorded for Tekton.'
          );


          appendMessage(
            'bot',
            'You can continue asking about your lift requirement.'
          );


          return true;

        }


        throw new Error(
          data.error ||
          'Lead submission was not confirmed.'
        );


      } catch (error) {

        hideLoading();


        console.error(
          'Tekton lead submission error:',
          error
        );


        customerData.leadSaved =
          false;


        state =
          'quoteMobile';


        appendMessage(
          'bot',
          'I could not confirm the enquiry submission. Please try the mobile number again.'
        );


        return false;


      } finally {

        leadSaveInProgress =
          false;

      }

    }


    /* ==========================================================
       SAVED STATE
       ========================================================== */

    async function handleSaved(
      text
    ) {

      var value =
        normalise(
          text
        );


      if (
        value === '0'
      ) {

        showMainMenu();

        return;

      }


      if (
        /^(hi|hello|hey|thanks|thank you|okay|ok)[!. ]*$/.test(
          value
        )
      ) {

        appendMessage(
          'bot',
          'You are welcome. Please choose a topic from the Main Menu.'
        );


        showMainMenu();

        return;

      }


      var answer =
        await localKnowledgeAnswer(
          text
        );


      if (
        answer
      ) {

        appendMessage(
          'bot',
          answer
        );

        return;

      }


      appendMessage(
        'bot',
        'Please choose a topic from the Main Menu.'
      );


      showMainMenu();

    }


    /* ==========================================================
       CENTRAL ROUTER
       ========================================================== */

    async function routeMessage(
      text
    ) {

      switch (
        state
      ) {

        case 'main':

          await handleMain(
            text
          );

          return;


        case 'liftSelection':

          await handleLiftSelection(
            text
          );

          return;


        case 'liftSelectionAction':

          await handleLiftSelectionAction(
            text
          );

          return;


        case 'shaft':

          await handleShaft(
            text
          );

          return;


        case 'capacity':

          await handleCapacity(
            text
          );

          return;


        case 'capacityInput':

          handleCapacityInput(
            text
          );

          return;


        case 'safety':

          await handleSafety(
            text
          );

          return;


        case 'maintenance':

          await handleMaintenance(
            text
          );

          return;


        case 'quoteRequirement':

          await handleQuoteRequirement(
            text
          );

          return;


        case 'quoteCapacity':

          await handleQuoteCapacity(
            text
          );

          return;


        case 'quoteFloors':

          await handleQuoteFloors(
            text
          );

          return;


        case 'quoteShaft':

          await handleQuoteShaft(
            text
          );

          return;


        case 'quoteInstallation':

          await handleQuoteInstallation(
            text
          );

          return;


        case 'quoteLocation':

          await handleQuoteLocation(
            text
          );

          return;


        case 'quoteName':

          await handleQuoteName(
            text
          );

          return;


        case 'quoteMobile':

          await handleQuoteMobile(
            text
          );

          return;


        case 'saved':

          await handleSaved(
            text
          );

          return;


        default:

          state =
            'main';

          showMainMenu();

      }

    }


    /* ==========================================================
       PROCESS MESSAGE
       ========================================================== */

    async function processUserMessage(
      text
    ) {

      if (
        processing
      ) {

        return;

      }


      var clean =
        String(
          text || ''
        ).trim();


      if (
        !clean
      ) {

        return;

      }


      if (
        clean.length >
        maxChars
      ) {

        appendMessage(
          'bot',
          'Please keep your message within ' +
          maxChars +
          ' characters.'
        );

        return;

      }


      appendMessage(
        'user',
        clean
      );


      setProcessing(
        true
      );


      try {

        await routeMessage(
          clean
        );

      } catch (error) {

        console.error(
          'Tekton AI router error:',
          error
        );


        appendMessage(
          'bot',
          'Sorry, something went wrong. Please try again.'
        );

      } finally {

        removeLoading();

        setProcessing(
          false
        );

        input.focus();

      }

    }


    /* ==========================================================
       FORM SUBMIT
       ========================================================== */

    form.addEventListener(
  'submit',
  function (event) {

    event.preventDefault();
    event.stopPropagation();

    if (processing) {
      return;
    }

    var text =
      input.value.trim();

    if (!text) {
      return;
    }

    input.value =
      '';

    processUserMessage(
      text
    );

  },
  false
);


    /* ==========================================================
       INITIAL STATE
       ========================================================== */

    modal.classList.remove(
      'is-active',
      'doors-open'
    );


    modal.setAttribute(
      'aria-hidden',
      'true'
    );


    console.log(
      '========================================'
    );


    console.log(
      'Tekton AI Stable V5 initialized.'
    );


    console.log(
      'Gemini: DISABLED'
    );


    console.log(
      'Location file:',
      locationFile
    );


    console.log(
      'Knowledge file:',
      knowledgeFile
    );


    console.log(
      '========================================'
    );


    /*
     * Load local files in background.
     * Failure does not kill chat.
     */

    loadLocations();

    loadKnowledge();

  }


  /* =========================================================
   TEKTON AI — START
   ========================================================= */

function start() {

  try {

    var widget =
      document.querySelector(
        '.ai-elevator-widget'
      );

    if (
      widget &&
      widget.parentElement !== document.body
    ) {

      document.body.appendChild(
        widget
      );

    }

    initTektonChat();

  } catch (error) {

    console.error(
      'Tekton AI startup error:',
      error
    );

  }

}


/* =========================================================
   DOM READY
   ========================================================= */

if (
  document.readyState === 'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    start,
    false
  );

} else {

  start();

}


/* =========================================================
   END
   ========================================================= */

})();
