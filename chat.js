(function () {
  'use strict';

  /* ============================================================
     TEKTON ASSIST — FINAL SIMPLE + COMPLETE V2
     Purpose:
       • Simple customer conversation
       • Show lift specification immediately
       • Collect project lead without the old quotation branches
       • Keep safety, maintenance, designer and contact help
       • Save completed leads to Google Sheets
       • No Gemini / browser API key required
     ============================================================ */

  var INIT_KEY = '__TEKTON_ASSIST_FINAL_V2__';

  if (window[INIT_KEY]) {
    return;
  }

  window[INIT_KEY] = true;

  function initTektonChat() {
    var config = window.TEKTON_CHAT || {};

    var proxyUrl = String(config.proxyUrl || '').trim();
    var locationFile = String(
      config.locationFile || './data/india-locations.json'
    );
    var knowledgeFile = String(
      config.knowledgeFile || './data/tekton-knowledge.json'
    );
    var maxChars = Number(config.maxChars || 800);

    var fabBtn = document.getElementById('aiFabBtn');
    var modal = document.getElementById('aiLiftModal');
    var closeBtn = document.getElementById('aiChatClose');
    var log = document.getElementById('aiChatLog');
    var form = document.getElementById('aiChatForm');
    var input = document.getElementById('aiChatInput');
    var sendBtn = document.getElementById('aiChatSend');

    if (!fabBtn || !modal || !closeBtn || !log || !form || !input) {
      console.error('Tekton Assist: required HTML elements are missing.');
      return;
    }

    var state = 'main';
    var processing = false;
    var welcomeShown = false;
    var leadSaving = false;

    var knowledge = null;
    var locations = [];
    var knowledgeLoaded = false;
    var locationsLoaded = false;

    var lead = {
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

    /* ------------------------------------------------------------
       HELPERS
       ------------------------------------------------------------ */

    function normalise(value) {
      return String(value == null ? '' : value)
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    }

    function normaliseLocation(value) {
      return normalise(value)
        .replace(/[.,/\\()_\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function appendMessage(role, text) {
      var message = document.createElement('div');
      message.className =
        'tkmsg ' +
        (role === 'user' ? 'tkmsg--user' : 'tkmsg--bot');

      var body = document.createElement('div');
      body.className = 'tkmsg__body';
      body.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');

      message.appendChild(body);
      log.appendChild(message);
      log.scrollTop = log.scrollHeight;
    }

    function showLoading(text) {
      removeLoading();

      var message = document.createElement('div');
      message.id = 'aiLoadingMsg';
      message.className = 'tkmsg tkmsg--bot';

      message.innerHTML =
        '<div class="tkmsg__body ai-loading-message">' +
          '<span class="ai-loading-dots">' +
            '<span></span><span></span><span></span>' +
          '</span>' +
          '<span>' + escapeHtml(text || 'Please wait...') + '</span>' +
        '</div>';

      log.appendChild(message);
      log.scrollTop = log.scrollHeight;
    }

    function removeLoading() {
      var old = document.getElementById('aiLoadingMsg');
      if (old) {
        old.remove();
      }
    }

    function hideLoading() {
      removeLoading();
    }

    function setProcessing(value) {
      processing = !!value;
      input.disabled = processing;

      if (sendBtn) {
        sendBtn.disabled = processing;
      }
    }

    /* ------------------------------------------------------------
       OPEN / CLOSE
       ------------------------------------------------------------ */

    function openChat() {
      modal.classList.add('is-active');
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.remove('doors-open');

      window.setTimeout(function () {
        modal.classList.add('doors-open');
      }, 120);

      window.setTimeout(function () {
        input.focus();
      }, 950);

      if (!welcomeShown) {
        welcomeShown = true;

        window.setTimeout(function () {
          appendMessage(
            'bot',
            '🙏 Warm wishes from Tekton Elevators on this special day.'
          );

          appendMessage(
            'bot',
            'Hi! I can show you lift specifications and collect your project enquiry.'
          );

          showMainMenu();
        }, 1050);
      }
    }

    function closeChat() {
      modal.classList.remove('doors-open');

      window.setTimeout(function () {
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
      }, 850);
    }

    /* ------------------------------------------------------------
       MENUS
       ------------------------------------------------------------ */

    function showMenu(options, includeBack) {
      var wrapper = document.createElement('div');
      wrapper.className =
        'tkmsg tkmsg--bot tekton-menu-message';

      var body = document.createElement('div');
      body.className = 'tkmsg__body';

      options.forEach(function (option) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'tekton-menu-btn';
        button.textContent =
          option.number + '. ' + option.label;

        button.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();

          if (processing) {
            return;
          }

          wrapper
            .querySelectorAll('button')
            .forEach(function (btn) {
              btn.disabled = true;
            });

          processUserMessage(
            option.number + '. ' + option.label
          );
        }, false);

        body.appendChild(button);
      });

      if (includeBack) {
        var backButton = document.createElement('button');
        backButton.type = 'button';
        backButton.className =
          'tekton-menu-btn tekton-menu-btn--back';
        backButton.textContent = '0. Main Menu';

        backButton.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();

          if (processing) {
            return;
          }

          processUserMessage('0');
        }, false);

        body.appendChild(backButton);
      }

      wrapper.appendChild(body);
      log.appendChild(wrapper);
      log.scrollTop = log.scrollHeight;
    }

    function showMainMenu() {
      state = 'main';

      appendMessage(
        'bot',
        'What would you like help with?'
      );

      showMenu([
        { number: '1', label: 'Lift Specifications' },
        { number: '2', label: 'Project Enquiry' },
        { number: '3', label: 'Safety & Standards' },
        { number: '4', label: 'Maintenance / AMC' },
        { number: '5', label: 'Lift Designer' },
        { number: '6', label: 'Contact Tekton' }
      ], false);
    }

    function showLiftTypes(nextState) {
      state = nextState || 'liftType';

      showMenu([
        { number: '1', label: 'Home / Villa Lift' },
        { number: '2', label: 'Passenger Lift' },
        { number: '3', label: 'Hospital / Stretcher Lift' },
        { number: '4', label: 'Goods / Freight Lift' },
        { number: '5', label: 'Modernisation' },
        { number: '6', label: 'Not sure — help me choose' }
      ], true);
    }

    function parseLiftType(text) {
      var value = normalise(text);

      if (
        value === '1' ||
        value.indexOf('home / villa') !== -1 ||
        value.indexOf('home lift') !== -1 ||
        value.indexOf('villa lift') !== -1 ||
        value.indexOf('home elevator') !== -1
      ) {
        return 'Home / Villa Lift';
      }

      if (
        value === '2' ||
        value.indexOf('passenger lift') !== -1 ||
        value.indexOf('passenger elevator') !== -1
      ) {
        return 'Passenger Lift';
      }

      if (
        value === '3' ||
        value.indexOf('hospital') !== -1 ||
        value.indexOf('stretcher') !== -1
      ) {
        return 'Hospital / Stretcher Lift';
      }

      if (
        value === '4' ||
        value.indexOf('goods lift') !== -1 ||
        value.indexOf('freight lift') !== -1
      ) {
        return 'Goods / Freight Lift';
      }

      if (
        value === '5' ||
        value.indexOf('modernisation') !== -1 ||
        value.indexOf('modernization') !== -1 ||
        value.indexOf('retrofit') !== -1
      ) {
        return 'Modernisation';
      }

      if (
        value === '6' ||
        value.indexOf('not sure') !== -1
      ) {
        return 'Not sure';
      }

      return '';
    }

    /* ------------------------------------------------------------
       SPECIFICATION
       ------------------------------------------------------------ */

    function builtInSpecification(type) {
      var answers = {
        'Home / Villa Lift':
          'Residential and luxury home lift solutions for villas and private residences. Final capacity, cabin, shaft, door and travel dimensions are selected according to the project and site conditions.',

        'Passenger Lift':
          'Passenger lift solutions for residential and commercial buildings. Final capacity, speed, cabin, door arrangement, travel and shaft dimensions depend on traffic and site requirements.',

        'Hospital / Stretcher Lift':
          'Hospital and stretcher lift solutions are planned around healthcare movement, cabin size, door arrangement, capacity and site conditions. Final engineering is project-specific.',

        'Goods / Freight Lift':
          'Goods and freight lift solutions are intended for material movement. Rated load, car area, loading conditions and duty requirements must be selected for the intended application.',

        'Modernisation':
          'Modernisation upgrades an existing lift after assessment of the current machine, controls, doors, safety devices and site conditions.'
      };

      return answers[type] || '';
    }

    function getSpecification(type) {
      var item = null;

      if (
        knowledge &&
        knowledge.lift_types &&
        knowledge.lift_types[type]
      ) {
        item = knowledge.lift_types[type];
      }

      var result =
        item && item.description
          ? item.description
          : builtInSpecification(type);

      if (
        item &&
        item.standard_note
      ) {
        result += '\n\n' + item.standard_note;
      }

      return result;
    }

    function showSpecification(type) {
      if (type === 'Not sure') {
        appendMessage(
          'bot',
          'No problem. I can help you choose based on building type, usage, capacity, floors and available shaft.'
        );

        askProjectStart();
        return;
      }

      lead.requirement = type;

      appendMessage(
        'bot',
        type
      );

      appendMessage(
        'bot',
        getSpecification(type)
      );

      appendMessage(
        'bot',
        'Would you like to share your project details with Tekton?'
      );

      askProjectStart();
    }

    function askProjectStart() {
      state = 'leadStart';

      showMenu([
        { number: '1', label: 'Start Project Enquiry' }
      ], true);
    }

    /* ------------------------------------------------------------
       SAFETY / MAINTENANCE / CONTACT
       ------------------------------------------------------------ */

    async function showSafetyMenu() {
      state = 'safety';

      appendMessage(
        'bot',
        'Safety information is available for the selected topic.'
      );

      showMenu([
        { number: '1', label: 'IS 14665' },
        { number: '2', label: 'Lift Door Safety' },
        { number: '3', label: 'Emergency / Trapped Passenger' }
      ], true);
    }

    async function handleSafety(text) {
      var value = normalise(text);

      if (value === '0') {
        showMainMenu();
        return;
      }

      if (value === '1' || value.indexOf('14665') !== -1) {
        var answer = await faqAnswer(
          'IS 14665 safety rules electric traction lifts'
        );

        appendMessage(
          'bot',
          answer ||
            'The uploaded IS 14665 Part 3 reference covers safety rules for electric traction passenger and goods lifts, including terminal/final limit provisions, door safety and testing.'
        );

        return;
      }

      if (
        value === '2' ||
        value.indexOf('door') !== -1
      ) {
        appendMessage(
          'bot',
          'Lift doors and their locking/interlocking arrangements are safety-critical. An automatically operated lift must not start unless the required doors are closed.'
        );

        return;
      }

      if (
        value === '3' ||
        value.indexOf('emergency') !== -1 ||
        value.indexOf('trapped') !== -1
      ) {
        appendMessage(
          'bot',
          'For a lift emergency, contact Tekton service at ' +
          (config.servicePhoneDisplay || '+91 95001 58530') +
          ' immediately. Do not force the lift doors open.'
        );

        return;
      }

      appendMessage(
        'bot',
        'Please choose one of the Safety & Standards options.'
      );

      showSafetyMenu();
    }

    function showMaintenanceMenu() {
      state = 'maintenance';

      appendMessage(
        'bot',
        'Tekton can help with maintenance, AMC and existing lift support.'
      );

      showMenu([
        { number: '1', label: 'AMC' },
        { number: '2', label: 'Preventive Maintenance' },
        { number: '3', label: 'Emergency Service' },
        { number: '4', label: 'Existing Lift Support' },
        { number: '5', label: 'Modernisation' }
      ], true);
    }

    function handleMaintenance(text) {
      var value = normalise(text);

      if (value === '0') {
        showMainMenu();
        return;
      }

      if (value === '1') {
        appendMessage(
          'bot',
          'Tekton provides preventive maintenance and Annual Maintenance Contract support. The exact AMC scope depends on the installed lift and service requirement.'
        );
        return;
      }

      if (value === '2') {
        appendMessage(
          'bot',
          'Preventive maintenance is planned around the installed lift, operating conditions and service requirements.'
        );
        return;
      }

      if (value === '3') {
        appendMessage(
          'bot',
          'For emergency service, please contact Tekton at ' +
          (config.servicePhoneDisplay || '+91 95001 58530') +
          '.'
        );
        return;
      }

      if (value === '4') {
        appendMessage(
          'bot',
          'Tekton can assess and support existing lift systems. The recommended service depends on the existing equipment and site condition.'
        );
        return;
      }

      if (value === '5') {
        appendMessage(
          'bot',
          'Tekton provides lift modernisation and retrofit support after assessment of the existing lift and site conditions.'
        );
        return;
      }

      appendMessage(
        'bot',
        'Please choose one of the Maintenance / AMC options.'
      );

      showMaintenanceMenu();
    }

    function showContact() {
      state = 'contact';

      appendMessage(
        'bot',
        'You can contact Tekton Elevators at ' +
        (config.phoneDisplay || '+91 89254 48131') +
        ' or ' +
        (config.servicePhoneDisplay || '+91 95001 58530') +
        '.'
      );

      appendMessage(
        'bot',
        'Email: ' +
        (config.email || 'info@tektonelevators.com')
      );

      appendMessage(
        'bot',
        'WhatsApp: +' +
        (config.whatsapp || '918925448131')
      );

      showMenu([
        { number: '1', label: 'Start Project Enquiry' },
        { number: '0', label: 'Main Menu' }
      ], false);
    }

    /* ------------------------------------------------------------
       FAQ
       ------------------------------------------------------------ */

    async function faqAnswer(text) {
      await loadKnowledge();

      var value = normalise(text);

      if (
        value.indexOf('trapped') !== -1 ||
        value.indexOf('stuck in lift') !== -1 ||
        value.indexOf('stuck in elevator') !== -1 ||
        value.indexOf('emergency') !== -1 ||
        value.indexOf('accident') !== -1
      ) {
        return (
          'For a lift emergency, contact Tekton service at ' +
          (config.servicePhoneDisplay || '+91 95001 58530') +
          ' immediately. Do not force the lift doors open.'
        );
      }

      if (
        value.indexOf('phone') !== -1 ||
        value.indexOf('contact') !== -1
      ) {
        return (
          'You can contact Tekton at ' +
          (config.phoneDisplay || '+91 89254 48131') +
          ' or service at ' +
          (config.servicePhoneDisplay || '+91 95001 58530') +
          '.'
        );
      }

      if (value.indexOf('email') !== -1) {
        return (
          'You can email Tekton Elevators at ' +
          (config.email || 'info@tektonelevators.com') +
          '.'
        );
      }

      if (knowledge && Array.isArray(knowledge.faq)) {
        for (var i = 0; i < knowledge.faq.length; i++) {
          var faq = knowledge.faq[i];

          if (!Array.isArray(faq.keywords)) {
            continue;
          }

          for (var j = 0; j < faq.keywords.length; j++) {
            var keyword = normalise(faq.keywords[j]);

            if (
              keyword &&
              value.indexOf(keyword) !== -1
            ) {
              return faq.answer;
            }
          }
        }
      }

      return '';
    }

    /* ------------------------------------------------------------
       LEAD FLOW
       ------------------------------------------------------------ */

    function askCapacity() {
      state = 'capacity';

      appendMessage(
        'bot',
        'What capacity do you need? Example: 4, 6 or 8 passengers. For goods lifts, you can enter the required load in kg. Type "not sure" if you are unsure.'
      );
    }

    function askFloors() {
      state = 'floors';

      appendMessage(
        'bot',
        'How many floors or stops should the lift serve? Example: G+2, 3 floors or 4 stops.'
      );
    }

    function askShaft() {
      state = 'shaft';

      appendMessage(
        'bot',
        'What is the approximate shaft width × depth? Example: 5 ft × 5 ft. Type "not available" if you do not know.'
      );
    }

    function askInstallation() {
      state = 'installation';

      appendMessage(
        'bot',
        'What type of project is this?'
      );

      showMenu([
        { number: '1', label: 'New Installation' },
        { number: '2', label: 'Existing Lift Replacement' },
        { number: '3', label: 'Modernisation' },
        { number: '4', label: 'Not Sure' }
      ], true);
    }

    function askLocation() {
      state = 'location';

      appendMessage(
        'bot',
        'Which city or project location should our team serve?'
      );
    }

    function askName() {
      state = 'name';

      appendMessage(
        'bot',
        'May I have your name?'
      );
    }

    function askMobile() {
      state = 'mobile';

      appendMessage(
        'bot',
        'What mobile number can our team use to contact you?'
      );
    }

    function extractPhone(text) {
      var digits = String(text || '').replace(/\D/g, '');

      if (
        digits.indexOf('91') === 0 &&
        digits.length === 12
      ) {
        digits = digits.slice(2);
      }

      return /^[6-9]\d{9}$/.test(digits)
        ? '+91' + digits
        : '';
    }

    function extractFloors(text) {
      var value = normalise(text);

      if (
        /^(not sure|unknown|dont know|don't know)$/.test(value)
      ) {
        return 'Not sure';
      }

      if (/g\s*\+\s*\d{1,3}/i.test(value)) {
        return String(text || '').trim();
      }

      var match = value.match(
        /\b(\d{1,3})\s*(?:floors?|levels?|stops?|storeys?|stories?)\b/i
      );

      if (match) {
        return String(text || '').trim();
      }

      if (/^\d{1,3}$/.test(value)) {
        return value;
      }

      return '';
    }

    function extractShaft(text) {
      var value = String(text || '').trim();

      if (
        /^(not available|unknown|dont know|don't know|not sure)$/i.test(value)
      ) {
        return 'Not available';
      }

      var match = value.match(
        /(\d+(?:\.\d+)?)\s*(ft|feet|mm|m)?\s*[x×*]\s*(\d+(?:\.\d+)?)\s*(ft|feet|mm|m)?/i
      );

      if (!match) {
        return '';
      }

      var unit = match[4] || match[2] || '';

      return (
        match[1] +
        ' × ' +
        match[3] +
        (unit ? ' ' + unit : '')
      ).trim();
    }

    function extractName(text) {
      var value = String(text || '').trim();

      var explicit = value.match(
        /(?:my name is|my name's|i am|i'm|this is|name is)\s*[:\-]?\s*([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3})/i
      );

      if (
        explicit &&
        explicit[1]
      ) {
        return explicit[1]
          .trim()
          .replace(/[.,!?]+$/, '');
      }

      var blocked = [
        'hi', 'hello', 'hey',
        'thanks', 'thank you',
        'okay', 'ok',
        'lift', 'elevator',
        'quote', 'quotation',
        'price', 'cost',
        'chennai', 'bengaluru',
        'bangalore'
      ];

      if (
        /^[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3}$/.test(value) &&
        blocked.indexOf(normalise(value)) === -1
      ) {
        return value;
      }

      return '';
    }

    async function loadKnowledge() {
      if (knowledgeLoaded) {
        return knowledge;
      }

      try {
        var response = await fetch(
          knowledgeFile + '?v=20260914-final1',
          {
            method: 'GET',
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          throw new Error(
            'Knowledge database HTTP ' + response.status
          );
        }

        knowledge = await response.json();
      } catch (error) {
        console.error(
          'Tekton knowledge database error:',
          error
        );

        knowledge = {
          faq: [],
          lift_types: {}
        };
      }

      knowledgeLoaded = true;
      return knowledge;
    }

    async function loadLocations() {
      if (locationsLoaded) {
        return locations;
      }

      try {
        var response = await fetch(
          locationFile + '?v=20260914-final1',
          {
            method: 'GET',
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          throw new Error(
            'Location database HTTP ' + response.status
          );
        }

        var data = await response.json();

        locations =
          data && Array.isArray(data.locations)
            ? data.locations
            : [];
      } catch (error) {
        console.error(
          'Tekton location database error:',
          error
        );

        locations = [];
      }

      locationsLoaded = true;
      return locations;
    }

    async function findLocation(text) {
      await loadLocations();

      var source = normaliseLocation(text);

      if (!source) {
        return null;
      }

      for (
        var i = 0;
        i < locations.length;
        i++
      ) {
        var item = locations[i];

        var names = [item.name];

        if (Array.isArray(item.aliases)) {
          names = names.concat(item.aliases);
        }

        for (
          var j = 0;
          j < names.length;
          j++
        ) {
          var candidate =
            normaliseLocation(names[j]);

          if (
            source === candidate ||
            source.indexOf(candidate) !== -1 ||
            candidate.indexOf(source) !== -1
          ) {
            return {
              name: item.name,
              district: item.district || '',
              state: item.state || ''
            };
          }
        }
      }

      /* Customer can give a location not yet in the local database. */
      return {
        name: String(text || '').trim(),
        district: '',
        state: ''
      };
    }

    function nextLeadStep() {
      if (!lead.requirement) {
        return showLiftTypes('leadLiftType');
      }

      if (!lead.capacity) {
        return askCapacity();
      }

      if (!lead.floors) {
        return askFloors();
      }

      if (!lead.shaftSize) {
        return askShaft();
      }

      if (!lead.installationType) {
        return askInstallation();
      }

      if (!lead.location) {
        return askLocation();
      }

      if (!lead.name) {
        return askName();
      }

      if (!lead.mobile) {
        return askMobile();
      }

      return submitLead();
    }

    /* ------------------------------------------------------------
       LEAD SUBMISSION
       ------------------------------------------------------------ */

    function fetchWithTimeout(url, options, timeout) {
      if (
        typeof AbortController === 'undefined'
      ) {
        return fetch(url, options);
      }

      var controller = new AbortController();

      var timer = window.setTimeout(function () {
        controller.abort();
      }, timeout);

      var requestOptions = Object.assign(
        {},
        options,
        {
          signal: controller.signal
        }
      );

      return fetch(
        url,
        requestOptions
      ).finally(function () {
        clearTimeout(timer);
      });
    }

    async function submitLead() {
      if (
        lead.leadSaved ||
        leadSaving
      ) {
        return true;
      }

      if (!proxyUrl) {
        appendMessage(
          'bot',
          'Your details are complete, but the enquiry connection is not configured.'
        );

        return false;
      }

      leadSaving = true;

      try {
        showLoading('Submitting your enquiry...');

        var response = await fetchWithTimeout(
          proxyUrl,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
              action: 'lead',
              sheetSource: 'Drawing_Leads',

              clientName:
                lead.name,

              clientPhone:
                lead.mobile,

              siteLocation:
                lead.location,

              floors:
                lead.floors,

              shaftSize:
                lead.shaftSize,

              requirement:
                lead.requirement,

              capacity:
                lead.capacity,

              installationType:
                lead.installationType
            })
          },
          12000
        );

        var raw = await response.text();
        var data = {};

        try {
          data =
            JSON.parse(
              raw || '{}'
            );
        } catch (error) {
          data = {};
        }

        hideLoading();

        if (
          response.ok &&
          data.ok === true
        ) {
          lead.leadSaved = true;
          state = 'saved';

          appendMessage(
            'bot',
            'Thank you, ' +
              lead.name +
              '. Your Tekton project enquiry has been recorded successfully.'
          );

          appendMessage(
            'bot',
            'Our team will contact you regarding the lift specification and project requirements.'
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

        appendMessage(
          'bot',
          'I could not confirm the enquiry submission right now. Please try again or contact Tekton at ' +
            (config.phoneDisplay || '+91 89254 48131') +
            '.'
        );

        return false;
      } finally {
        leadSaving = false;
      }
    }

    /* ------------------------------------------------------------
       MAIN ROUTER
       ------------------------------------------------------------ */

    async function routeMessage(text) {
      var value = normalise(text);

      if (
        value === '0' ||
        value === 'main menu' ||
        value === 'menu'
      ) {
        showMainMenu();
        return;
      }

      /* General greetings */
      if (
        /^(hi|hello|hey|good morning|good afternoon|good evening|good day)[!. ]*$/.test(value)
      ) {
        appendMessage(
          'bot',
          'Hello! How can I help you with your lift requirement?'
        );
        showMainMenu();
        return;
      }

      /* ----------------------------------------------------------
         MAIN
         ---------------------------------------------------------- */

      if (state === 'main') {
        var directType = parseLiftType(text);

        if (directType) {
          showSpecification(directType);
          return;
        }

        if (
          value === '1' ||
          value.indexOf('lift specification') !== -1 ||
          value.indexOf('lift specs') !== -1 ||
          value.indexOf('lift selection') !== -1
        ) {
          appendMessage(
            'bot',
            'Choose a lift type and I will show the relevant specification.'
          );
          showLiftTypes('liftType');
          return;
        }

        if (
          value === '2' ||
          value.indexOf('project enquiry') !== -1 ||
          value.indexOf('quotation') !== -1 ||
          value.indexOf('quote') !== -1 ||
          value.indexOf('price') !== -1 ||
          value.indexOf('cost') !== -1
        ) {
          state = 'leadLiftType';
          appendMessage(
            'bot',
            'Sure. I will collect only the essential project details.'
          );
          nextLeadStep();
          return;
        }

        if (
          value === '3' ||
          value.indexOf('safety') !== -1 ||
          value.indexOf('standards') !== -1 ||
          value.indexOf('14665') !== -1
        ) {
          showSafetyMenu();
          return;
        }

        if (
          value === '4' ||
          value.indexOf('maintenance') !== -1 ||
          value.indexOf('amc') !== -1
        ) {
          showMaintenanceMenu();
          return;
        }

        if (
          value === '5' ||
          value.indexOf('designer') !== -1
        ) {
          appendMessage(
            'bot',
            'You can use the Tekton Lift Designer on this website to work with shaft and cabin planning.'
          );
          return;
        }

        if (
          value === '6' ||
          value.indexOf('contact') !== -1 ||
          value.indexOf('phone') !== -1 ||
          value.indexOf('email') !== -1 ||
          value.indexOf('whatsapp') !== -1
        ) {
          showContact();
          return;
        }

        var mainAnswer =
          await faqAnswer(text);

        if (mainAnswer) {
          appendMessage(
            'bot',
            mainAnswer
          );
          return;
        }

        appendMessage(
          'bot',
          'Please choose a lift type or ask me about specifications, safety, maintenance or a project enquiry.'
        );
        showMainMenu();
        return;
      }

      /* ----------------------------------------------------------
         LIFT TYPE / SPECIFICATION
         ---------------------------------------------------------- */

      if (state === 'liftType') {
        var liftType = parseLiftType(text);

        if (!liftType) {
          appendMessage(
            'bot',
            'Please choose a lift type.'
          );
          showLiftTypes('liftType');
          return;
        }

        showSpecification(liftType);
        return;
      }

      /* ----------------------------------------------------------
         START LEAD
         ---------------------------------------------------------- */

      if (state === 'leadStart') {
        if (
          value === '1' ||
          value.indexOf('start project enquiry') !== -1
        ) {
          nextLeadStep();
          return;
        }

        showMainMenu();
        return;
      }

      /* ----------------------------------------------------------
         LEAD LIFT TYPE
         ---------------------------------------------------------- */

      if (state === 'leadLiftType') {
        var selectedType =
          parseLiftType(text);

        if (!selectedType) {
          appendMessage(
            'bot',
            'Please choose a lift type.'
          );
          showLiftTypes('leadLiftType');
          return;
        }

        lead.requirement =
          selectedType;

        if (
          selectedType !== 'Not sure'
        ) {
          appendMessage(
            'bot',
            'Selected: ' +
              selectedType
          );

          appendMessage(
            'bot',
            getSpecification(selectedType)
          );
        }

        nextLeadStep();
        return;
      }

      /* ----------------------------------------------------------
         LEAD DETAILS
         ---------------------------------------------------------- */

      if (state === 'capacity') {
        if (!value) {
          return;
        }

        lead.capacity =
          String(text || '').trim();

        askFloors();
        return;
      }

      if (state === 'floors') {
        var floorValue =
          extractFloors(text);

        if (!floorValue) {
          appendMessage(
            'bot',
            'Please enter the floors/stops, for example G+2 or 4 stops.'
          );
          return;
        }

        lead.floors =
          floorValue;

        askShaft();
        return;
      }

      if (state === 'shaft') {
        var shaftValue =
          extractShaft(text);

        if (!shaftValue) {
          appendMessage(
            'bot',
            'Please enter an approximate shaft width × depth, for example 5 ft × 5 ft, or type "not available".'
          );
          return;
        }

        lead.shaftSize =
          shaftValue;

        askInstallation();
        return;
      }

      if (state === 'installation') {
        if (value === '1') {
          lead.installationType =
            'New installation';
          askLocation();
          return;
        }

        if (value === '2') {
          lead.installationType =
            'Existing lift replacement';
          askLocation();
          return;
        }

        if (value === '3') {
          lead.installationType =
            'Modernisation';
          askLocation();
          return;
        }

        if (
          value === '4' ||
          value.indexOf('not sure') !== -1
        ) {
          lead.installationType =
            'Not sure';
          askLocation();
          return;
        }

        appendMessage(
          'bot',
          'Please choose one of the project options.'
        );

        askInstallation();
        return;
      }

      if (state === 'location') {
        var location =
          await findLocation(text);

        if (
          location &&
          location.name
        ) {
          lead.location =
            location.name;

          lead.district =
            location.district;

          lead.state =
            location.state;

          askName();
          return;
        }

        appendMessage(
          'bot',
          'Please enter the project city or location.'
        );

        return;
      }

      if (state === 'name') {
        var customerName =
          extractName(text);

        if (!customerName) {
          appendMessage(
            'bot',
            'Please enter your name.'
          );
          return;
        }

        lead.name =
          customerName;

        askMobile();
        return;
      }

      if (state === 'mobile') {
        var customerPhone =
          extractPhone(text);

        if (!customerPhone) {
          appendMessage(
            'bot',
            'Please enter a valid 10-digit Indian mobile number.'
          );
          return;
        }

        lead.mobile =
          customerPhone;

        await submitLead();
        return;
      }

      /* ----------------------------------------------------------
         SAFETY
         ---------------------------------------------------------- */

      if (state === 'safety') {
        await handleSafety(text);
        return;
      }

      /* ----------------------------------------------------------
         MAINTENANCE
         ---------------------------------------------------------- */

      if (state === 'maintenance') {
        handleMaintenance(text);
        return;
      }

      /* ----------------------------------------------------------
         CONTACT
         ---------------------------------------------------------- */

      if (state === 'contact') {
        if (
          value === '1' ||
          value.indexOf('start project enquiry') !== -1
        ) {
          state = 'leadLiftType';
          nextLeadStep();
          return;
        }

        showMainMenu();
        return;
      }

      /* ----------------------------------------------------------
         SAVED
         ---------------------------------------------------------- */

      if (state === 'saved') {
        var savedAnswer =
          await faqAnswer(text);

        if (savedAnswer) {
          appendMessage(
            'bot',
            savedAnswer
          );
        } else {
          appendMessage(
            'bot',
            'Your Tekton enquiry has already been recorded. You can continue asking about lift specifications.'
          );
        }

        return;
      }

      showMainMenu();
    }

    /* ------------------------------------------------------------
       MESSAGE PROCESSING
       ------------------------------------------------------------ */

    async function processUserMessage(text) {
      if (processing) {
        return;
      }

      var clean =
        String(text || '').trim();

      if (!clean) {
        return;
      }

      if (clean.length > maxChars) {
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

      setProcessing(true);

      try {
        await routeMessage(clean);
      } catch (error) {
        console.error(
          'Tekton Assist router error:',
          error
        );

        appendMessage(
          'bot',
          'Sorry, something went wrong. Please try again.'
        );
      } finally {
        removeLoading();
        setProcessing(false);
        input.focus();
      }
    }

    /* ------------------------------------------------------------
       EVENTS
       ------------------------------------------------------------ */

    fabBtn.addEventListener(
      'click',
      function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (
          !modal.classList.contains('is-active')
        ) {
          openChat();
        }
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

        input.value = '';

        processUserMessage(text);
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

    modal.classList.remove(
      'is-active',
      'doors-open'
    );

    modal.setAttribute(
      'aria-hidden',
      'true'
    );

    /* ------------------------------------------------------------
       BACKGROUND LOAD
       ------------------------------------------------------------ */

    loadKnowledge();
    loadLocations();

    console.log(
      'Tekton Assist Final V2 initialized.'
    );
  }

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
        document.body.appendChild(widget);
      }

      initTektonChat();
    } catch (error) {
      console.error(
        'Tekton Assist startup error:',
        error
      );
    }
  }

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
})();
